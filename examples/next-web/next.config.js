const path = require('path');

const withTranspileModules = require('next-transpile-modules')([
  '@datadata/admin-react-components',
  '@datadata/core',
  '@datadata/server',
]);

module.exports = withTranspileModules({
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['react'] = path.resolve(__dirname, '.', 'node_modules', 'react');
    return config;
  },
});
