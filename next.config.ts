import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow images from any domain (needed for Supabase storage and port forwarding)
  images: {
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
