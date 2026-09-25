import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true, // on purpose: every demo must survive mount → unmount → mount
  // three / postprocessing ship modern ESM; transpiling keeps older Safari happy
  transpilePackages: ['three'],
  async headers() {
    return [
      {
        // long-lived caching for generated media
        source: '/:dir(images|sequence|video|lottie|benchmarks)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
