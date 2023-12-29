/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  experimental: {
    optimizePackageImports: ['@dossierhq/design', '@dossierhq/react-components'],
  },
};

export default config;
