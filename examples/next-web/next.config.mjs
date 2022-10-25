/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    // https://github.com/brianc/node-postgres/issues/838
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$/ }));
    return config;
  },
};

export default config;
