/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.stability.ai', 'boredcaster.xyz'],
  },
};

module.exports = nextConfig;
