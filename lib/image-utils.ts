/**
 * Utility functions for image handling
 */

import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Convert a storage path to a proxy URL
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @returns Proxy URL in the format /api/image/bucket/path
 */
export function getProxyUrl(bucket: string, path: string): string {
  return `/api/image/${bucket}/${path}`;
}

/**
 * Extract bucket and path from a proxy URL
 * @param proxyUrl - Proxy URL (e.g., /api/image/file/userId/file.png)
 * @returns Object with bucket and path
 */
export function parseProxyUrl(proxyUrl: string): { bucket: string; path: string } | null {
  const match = proxyUrl.match(/^\/api\/image\/([^\/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
}

/**
 * Migrate a file from upload bucket to file bucket (for persistence)
 * @param uploadUrl - Public URL from upload bucket
 * @param userId - User ID for new file path
 * @param prefix - Optional prefix for file name (default: 'file')
 * @returns New public URL in file bucket
 */
export async function migrateToFileBucket(
  uploadUrl: string,
  userId: string,
  prefix: string = 'file'
): Promise<string> {
  const supabase = await createServerClient();

  // Extract path from upload URL
  const uploadPath = extractStoragePath(uploadUrl);

  // Download from upload bucket
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from('upload')
    .download(uploadPath);

  if (downloadError || !downloadData) {
    throw new Error(`Failed to download from upload bucket: ${downloadError?.message}`);
  }

  // Generate new path in file bucket
  const ext = uploadPath.split('.').pop() || 'png';
  const newPath = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  // Upload to file bucket with new path
  const arrayBuffer = await downloadData.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from('file').upload(newPath, arrayBuffer, {
    contentType: downloadData.type,
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Failed to upload to file bucket: ${uploadError.message}`);
  }

  // Delete from upload bucket
  const { error: deleteError } = await supabase.storage.from('upload').remove([uploadPath]);

  if (deleteError) {
    console.warn(`Failed to delete from upload bucket: ${deleteError.message}`);
  }

  // Return proxy URL instead of public URL for security
  return getProxyUrl('file', newPath);
}

/**
 * Migrate multiple files from upload bucket to file bucket
 * @param uploadUrls - Array of public URLs from upload bucket
 * @param userId - User ID for new file paths
 * @param prefix - Optional prefix for file names
 * @returns Array of new public URLs in file bucket
 */
export async function migrateMultipleToFileBucket(
  uploadUrls: string[],
  userId: string,
  prefix: string = 'file'
): Promise<string[]> {
  return Promise.all(uploadUrls.map((url) => migrateToFileBucket(url, userId, prefix)));
}

/**
 * Extract storage path from Supabase public URL or proxy URL
 * @param url - Public URL from Supabase storage or proxy URL
 * @returns Storage path (e.g., "userId/file.png")
 */
export function extractStoragePath(url: string): string {
  // Check if it's a proxy URL first
  const proxyData = parseProxyUrl(url);
  if (proxyData) {
    return proxyData.path;
  }

  // Otherwise, handle as Supabase public URL
  // URL format: https://.../storage/v1/object/public/bucket/path
  const match = url.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
  if (!match) {
    throw new Error('Invalid storage URL');
  }
  return decodeURIComponent(match[1]);
}

/**
 * Fetch an image from a URL and convert it to a base64 data URL
 * This is useful when the API cannot directly access the image URL
 * Supports both absolute URLs and proxy URLs (starting with /api/image/)
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  // Convert proxy URL to absolute URL if needed
  const absoluteUrl = url.startsWith('/')
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${url}`
    : url;
  try {
    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Get content type from response or default to png
    const contentType = response.headers.get('content-type') || 'image/png';

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image as base64:', error);
    throw error;
  }
}

/**
 * Convert multiple image URLs to base64 data URLs
 */
export async function fetchImagesAsBase64(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map((url) => fetchImageAsBase64(url)));
}
