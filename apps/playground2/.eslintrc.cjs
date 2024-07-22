require('@dossierhq/eslint-config-react/patch/modern-module-resolution.js');

module.exports = {
  extends: ['@dossierhq/eslint-config-react/profile/app.js'],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json'],
  },
};
