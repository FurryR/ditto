import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { Template } from '@/lib/typeorm/entities/Template';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { getCurrentUserId } from '@/lib/typeorm/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileRepo = await getRepository(Profile);
    const templateRepo = await getRepository(Template);
    const workRepo = await getRepository(UserWork);

    const profile = await profileRepo.findOne({ where: { id: userId } });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const [templates, works] = await Promise.all([
      templateRepo.find({
        where: { authorId: userId },
        order: { createdAt: 'DESC' },
        take: 12,
      }),
      workRepo.find({
        where: { userId: userId },
        order: { createdAt: 'DESC' },
        take: 18,
      }),
    ]);

    return NextResponse.json({
      profile,
      templates,
      works,
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const profileRepo = await getRepository(Profile);

    await profileRepo.update({ id: userId }, body);

    const updatedProfile = await profileRepo.findOne({ where: { id: userId } });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
