/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  experimental: {
    optimizePackageImports: ['@dossierhq/react-components2'],
  },
};

export default config;
