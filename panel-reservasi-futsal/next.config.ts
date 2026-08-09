import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendTarget = process.env.BACKEND_INTERNAL_URL || '127.0.0.1:4000';
    const backendUrl = backendTarget.startsWith('http://') || backendTarget.startsWith('https://')
      ? backendTarget
      : `http://${backendTarget}`;

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
