import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { UserFollow } from '@/lib/typeorm/entities/UserFollow';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const profileRepo = await getRepository(Profile);
    const followRepo = await getRepository(UserFollow);

    // Get all users following this user
    const follows = await followRepo.find({
      where: { followingId: id },
      order: { createdAt: 'DESC' },
    });

    const followerIds = follows.map((f) => f.followerId);

    if (followerIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get profiles of followers
    const profiles = await profileRepo
      .createQueryBuilder('profile')
      .where('profile.id IN (:...ids)', { ids: followerIds })
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
    console.error('Failed to fetch followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
