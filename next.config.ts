import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mofmwtbkyabnqepqofcj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'th-test-11.slatic.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kingofdribble.co.id',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.adidas.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.nike.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.puma.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.mizuno.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.fisikfootball.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.newbalance.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.underarmour.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.asics.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
