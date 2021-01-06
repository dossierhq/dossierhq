const withTranspileModules = require('next-transpile-modules')([
  '@datadata/admin-react-components',
  '@datadata/core',
  '@datadata/server',
]);

module.exports = withTranspileModules({ reactStrictMode: true });
