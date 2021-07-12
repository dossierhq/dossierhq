const path = require('path');

const withTranspileModules = require('next-transpile-modules')([
  '@jonasb/datadata-admin-react-components',
  '@jonasb/datadata-core',
  '@jonasb/datadata-graphql',
  '@jonasb/datadata-server',
]);

module.exports = withTranspileModules({
  future: {
    webpack5: true,
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['react'] = path.resolve(__dirname, '.', 'node_modules', 'react');
    return config;
  },
});
