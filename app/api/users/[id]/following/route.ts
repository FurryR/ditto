import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { UserFollow } from '@/lib/typeorm/entities/UserFollow';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const profileRepo = await getRepository(Profile);
    const followRepo = await getRepository(UserFollow);

    // Get all users that this user is following
    const follows = await followRepo.find({
      where: { followerId: id },
      order: { createdAt: 'DESC' },
    });

    const followingIds = follows.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get profiles of users being followed
    const profiles = await profileRepo
      .createQueryBuilder('profile')
      .where('profile.id IN (:...ids)', { ids: followingIds })
      .getMany();

    // Get follow counts for each profile
    const usersWithCounts = await Promise.all(
      profiles.map(async (profile) => {
        const [followingCount, followersCount] = await Promise.all([
          followRepo.count({ where: { followerId: profile.id } }),
          followRepo.count({ where: { followingId: profile.id } }),
        ]);

        return {
          ...profile,
          followingCount,
          followersCount,
        };
      })
    );

    return NextResponse.json({ users: usersWithCounts });
  } catch (error) {
    console.error('Failed to fetch following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
