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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude `ejs` from being bundled on the client side by Webpack
      config.externals.push('ejs');
    }

    return config;
  },
};

export default nextConfig;
