/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static1.srcdn.com',
        pathname: '/wordpress/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
