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
    'plugin:testing-library/dom',
    'plugin:testing-library/react',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@rushstack/eslint-plugin',
    '@typescript-eslint',
    'jest-dom',
    'react',
    'testing-library',
  ],
  reportUnusedDisableDirectives: true,
  rules: {
    '@rushstack/hoist-jest-mock': ['error'],
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
  },
  settings: { react: { version: 'detect' } },
};
