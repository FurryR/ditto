/**
 * Custom image loader for Next.js Image component
 * Handles both external URLs and internal API routes
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If it's an internal API route, return it as-is without optimization
  if (src.startsWith('/api/')) {
    return src;
  }

  // For external URLs, use Next.js default image optimization
  const params = [`w=${width}`];
  if (quality) {
    params.push(`q=${quality || 75}`);
  }

  // For absolute URLs
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/_next/image?url=${encodeURIComponent(src)}&${params.join('&')}`;
  }

  // For other relative paths, use default optimization
  return `/_next/image?url=${encodeURIComponent(src)}&${params.join('&')}`;
}
