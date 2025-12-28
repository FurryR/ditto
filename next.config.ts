import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Use custom loader to handle /api/ routes
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
};

export default withNextIntl(nextConfig);
