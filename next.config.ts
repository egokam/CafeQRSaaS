import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false, // إخفاء ترويسة X-Powered-By
  experimental: {
    // Payment receipts are sent through an authenticated Server Action. Allow
    // the 5MB validated image plus multipart request overhead.
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
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

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);