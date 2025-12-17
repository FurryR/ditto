import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { getCurrentUserId } from '@/lib/typeorm/auth';
import { createClient } from '@/lib/supabase/server';
import { migrateToFileBucket, getProxyUrl } from '@/lib/image-utils';

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to upload bucket first (temporary storage)
    const supabase = await createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}.${fileExt}`;
    const uploadPath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('upload')
      .upload(uploadPath, file, { upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get proxy URL for the upload
    const uploadProxyUrl = getProxyUrl('upload', uploadPath);

    // Migrate to file bucket for persistence
    const fileUrl = await migrateToFileBucket(uploadProxyUrl, userId, 'banner');

    // Update profile in database
    const profileRepo = await getRepository(Profile);
    const profile = await profileRepo.findOne({ where: { id: userId } });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const socialLinks = profile.socialLinks || {};
    socialLinks.banner = fileUrl;

    await profileRepo.update({ id: userId }, { socialLinks: socialLinks });

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Failed to upload banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
