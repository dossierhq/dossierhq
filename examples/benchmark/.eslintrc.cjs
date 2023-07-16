require('@dossierhq/eslint-config-generic/patch/modern-module-resolution.js');

module.exports = {
  extends: ['@dossierhq/eslint-config-generic/profile/tool-esm.js'],
  ignorePatterns: ['.eslintrc.cjs', 'deno/**', 'deno-external-dependencies.ts'],
};
