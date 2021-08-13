const path = require('path');

module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['react'] = path.resolve(__dirname, '.', 'node_modules', 'react');
    return config;
  },
};
