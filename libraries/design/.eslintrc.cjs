module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:storybook/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react'],
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
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      },
    ],
    'react/react-in-jsx-scope': ['off'],
  },
  settings: { react: { version: 'detect' } },
};
