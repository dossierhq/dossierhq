module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest-dom/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:testing-library/react',
    'plugin:testing-library/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jest-dom', 'react', 'testing-library'],
  reportUnusedDisableDirectives: true,
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'local',
        args: 'after-used',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^unused',
        argsIgnorePattern: '^unused',
      },
    ],
  },
  settings: { react: { version: '17.0.1' } },
};
