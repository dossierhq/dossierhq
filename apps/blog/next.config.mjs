/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: { appDir: true, serverComponentsExternalPackages: ['sqlite3'] },
};

export default config;
