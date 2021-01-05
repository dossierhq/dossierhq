const withTranspileModules = require('next-transpile-modules')([
  '@datadata/admin-react-components',
]);

module.exports = withTranspileModules();
