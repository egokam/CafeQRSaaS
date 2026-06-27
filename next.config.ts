import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // 👈 هادي هي اللي كتخلي الـ Docker Image تكون صغيرة وسريعة
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'hzrteijomqftshzwqrdr.supabase.co',
      },
    ],
  },
};

export default nextConfig;