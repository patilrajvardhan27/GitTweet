import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return [
      { source: '/auth/:path*', destination: `${apiUrl}/auth/:path*` },
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
    ],
  },
};

export default nextConfig;
