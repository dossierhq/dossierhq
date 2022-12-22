/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  // productionBrowserSourceMaps: true,
  experimental: { appDir: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle fs require in sql.js
      config.resolve.fallback.fs = false;
    }
    return config;
  },
};

export default config;
