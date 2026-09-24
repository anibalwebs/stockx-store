import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Puedes cambiar '10mb' al tamaño máximo que requieras (ej. '5mb', '20mb')
    },
  },
};

export default nextConfig;