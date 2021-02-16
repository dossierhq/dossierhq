module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  reportUnusedDisableDirectives: true,
  rules: {
    '@typescript-eslint/consistent-type-imports': ['warn'],
    '@typescript-eslint/no-parameter-properties': ['error'],
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
};
