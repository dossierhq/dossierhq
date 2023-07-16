require('@dossierhq/eslint-config-generic/patch/modern-module-resolution.js');

module.exports = {
  extends: ['@dossierhq/eslint-config-generic/profile/library-esm.js'],
  ignorePatterns: ['\\.eslintrc\\.cjs', 'lib/**'],
};
