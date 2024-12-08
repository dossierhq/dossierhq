/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    optimizePackageImports: [
      '@dossierhq/design',
      '@dossierhq/react-components',
      '@dossierhq/react-components2',
    ],
  },
};

export default config;
