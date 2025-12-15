/**
 * Utility functions for image handling
 */

import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Migrate a file from upload bucket to file bucket (for persistence)
 * @param uploadUrl - Public URL from upload bucket
 * @param userId - User ID for new file path
 * @param prefix - Optional prefix for file name (default: 'file')
 * @returns New public URL in file bucket
 */
export async function migrateToFileBucket(uploadUrl: string, userId: string, prefix: string = 'file'): Promise<string> {
  const supabase = await createServerClient();
  
  // Extract path from upload URL
  const uploadPath = extractStoragePath(uploadUrl);
  
  // Download from upload bucket
  const { data: downloadData, error: downloadError } = await supabase
    .storage
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
  const { error: uploadError } = await supabase
    .storage
    .from('file')
    .upload(newPath, arrayBuffer, {
      contentType: downloadData.type,
      upsert: false,
    });
    
  if (uploadError) {
    throw new Error(`Failed to upload to file bucket: ${uploadError.message}`);
  }
  
  // Delete from upload bucket
  const { error: deleteError } = await supabase
    .storage
    .from('upload')
    .remove([uploadPath]);
    
  if (deleteError) {
    console.warn(`Failed to delete from upload bucket: ${deleteError.message}`);
  }
  
  // Return public URL from file bucket
  const { data } = supabase.storage.from('file').getPublicUrl(newPath);
  return data.publicUrl;
}

/**
 * Migrate multiple files from upload bucket to file bucket
 * @param uploadUrls - Array of public URLs from upload bucket
 * @param userId - User ID for new file paths
 * @param prefix - Optional prefix for file names
 * @returns Array of new public URLs in file bucket
 */
export async function migrateMultipleToFileBucket(uploadUrls: string[], userId: string, prefix: string = 'file'): Promise<string[]> {
  return Promise.all(uploadUrls.map(url => migrateToFileBucket(url, userId, prefix)));
}

/**
 * Extract storage path from Supabase public URL
 * @param publicUrl - Public URL from Supabase storage
 * @returns Storage path (e.g., "userId/file.png")
 */
export function extractStoragePath(publicUrl: string): string {
  // URL format: https://.../storage/v1/object/public/bucket/path
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
  if (!match) {
    throw new Error('Invalid Supabase storage URL');
  }
  return decodeURIComponent(match[1]);
}

/**
 * Fetch an image from a URL and convert it to a base64 data URL
 * This is useful when the API cannot directly access the image URL
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
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
  return Promise.all(urls.map(url => fetchImageAsBase64(url)));
}
