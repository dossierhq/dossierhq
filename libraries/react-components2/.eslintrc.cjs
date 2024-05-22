module.exports = {
  env: {
    browser: true,
    es2023: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:storybook/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2023,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'eslint-plugin-react-compiler'],
  reportUnusedDisableDirectives: true,
  rules: {
    '@typescript-eslint/consistent-type-imports': ['warn'],
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
    'react-compiler/react-compiler': ['error'],
  },
  settings: { react: { version: 'detect' } },
};
