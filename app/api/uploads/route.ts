import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/uploads
 * Upload files to the temporary 'upload' bucket
 * All uploads are temporary and should be migrated to 'file' bucket when published
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const prefix = form.get('prefix') || 'upload';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.split('.').pop() || 'png';
    const path = `${user.id}/${prefix}-${randomUUID()}.${ext}`;

    // Always upload to 'upload' bucket (temporary storage)
    const { error } = await supabase.storage.from('upload').upload(path, buffer, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from('upload').getPublicUrl(path);
    return NextResponse.json({ 
      url: data.publicUrl,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
