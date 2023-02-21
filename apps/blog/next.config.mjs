/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,
  experimental: { appDir: true },
  images: {
    domains: ['res.cloudinary.com'],
  },
};

export default config;
