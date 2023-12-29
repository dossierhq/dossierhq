/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    optimizePackageImports: ['@dossierhq/design', '@dossierhq/react-components'],
  },
};

export default config;
