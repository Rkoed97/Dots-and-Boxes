const isDev = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/dots-and-boxes',
  assetPrefix: '/dots-and-boxes/',
  output: 'standalone',
  async rewrites() {
    if (isDev) {
      return [
        {
          source: '/dots-and-boxes/api/:path*',
          destination: 'http://localhost:4000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
