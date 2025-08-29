/** @type {import('next').NextConfig} */
const nextConfig = {
  // 支持服务端组件的外部包
  serverExternalPackages: ['@supabase/supabase-js'],
  // 确保Next.js识别src目录结构
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['supabase.co', 'avatars.githubusercontent.com'],
    formats: ['image/webp', 'image/avif']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
