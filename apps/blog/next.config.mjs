/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: { appDir: true },
  webpack: (config, _context) => {
    config.module.noParse = /\bnode_modules\/sql\.js\/dist\/sql-wasm\.js$/;
    return config;
  },
};

export default config;
