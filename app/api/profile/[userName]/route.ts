import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { Template } from '@/lib/typeorm/entities/Template';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { UserFollow } from '@/lib/typeorm/entities/UserFollow';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userName: string }> }
) {
  try {
    const { userName } = await params;
    
    const profileRepo = await getRepository(Profile);
    const templateRepo = await getRepository(Template);
    const workRepo = await getRepository(UserWork);
    const followRepo = await getRepository(UserFollow);

    const profile = await profileRepo.findOne({ 
      where: { githubUsername: userName } 
    });
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const [templates, works, followingCount, followersCount] = await Promise.all([
      templateRepo.find({
        where: { authorId: profile.id, isPublished: true },
        order: { createdAt: 'DESC' },
        take: 12,
      }),
      workRepo.find({
        where: { userId: profile.id, isPublished: true },
        order: { createdAt: 'DESC' },
        take: 18,
      }),
      followRepo.count({ where: { followerId: profile.id } }),
      followRepo.count({ where: { followingId: profile.id } }),
    ]);

    return NextResponse.json({
      profile: {
        ...profile,
        followingCount,
        followersCount,
      },
      templates,
      works,
    });
  } catch (error) {
    console.error('Failed to fetch public profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
