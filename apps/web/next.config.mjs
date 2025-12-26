const isDev = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    if (isDev) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4000/api/:path*',
        },
      ];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
