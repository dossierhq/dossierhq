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
    'plugin:import/recommended',
    'plugin:import/typescript',
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
    // For ECMA script module, we need to always import with file extension (which should be .js, not .ts)
    'import/extensions': ['error', { js: 'always', jsx: 'always', ts: 'always', tsx: 'always' }],
    // The typescript import rule gets confused when we import with .js file extension to a .ts file (even though it's valid)
    'import/no-unresolved': ['off'],
  },
  settings: { react: { version: 'detect' } },
};
