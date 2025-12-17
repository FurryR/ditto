import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/image/[bucket]/[...path]
 * Proxy images from Supabase storage to avoid exposing the storage URL
 * This provides an additional security layer and allows for future enhancements
 * like access control, rate limiting, or image transformations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bucket: string; path: string[] } }
) {
  try {
    const { bucket, path } = params;
    const filePath = path.join('/');

    // Validate bucket name to prevent unauthorized access
    const allowedBuckets = ['upload', 'file'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const supabase = await createClient();

    // Download the file from Supabase storage
    const { data, error } = await supabase.storage.from(bucket).download(filePath);

    if (error || !data) {
      console.error('Error downloading file:', error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get the content type from the blob
    const contentType = data.type || 'application/octet-stream';

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();

    // Return the file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
