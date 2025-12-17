import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { getCurrentUserId } from '@/lib/typeorm/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileRepo = await getRepository(Profile);
    const profile = await profileRepo.findOne({ where: { id: userId } });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      socialLinks: profile.socialLinks || {},
      apiSettings: profile.apiSettings || {},
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
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
    const { socialLinks, apiSettings } = body;

    const profileRepo = await getRepository(Profile);
    const profile = await profileRepo.findOne({ where: { id: userId } });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updates: any = {};

    if (socialLinks !== undefined) {
      updates.socialLinks = socialLinks;
    }

    if (apiSettings !== undefined) {
      // Merge with existing apiSettings
      const currentApiSettings = profile.apiSettings || {};
      updates.apiSettings = { ...currentApiSettings, ...apiSettings };
    }

    await profileRepo.update({ id: userId }, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
