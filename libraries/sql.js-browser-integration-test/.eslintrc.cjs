require('@dossierhq/eslint-config-generic/patch/modern-module-resolution.js');

module.exports = {
  extends: ['@dossierhq/eslint-config-generic/profile/tool.js'],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json'],
  },
};
