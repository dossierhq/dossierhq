function buildRules(profile) {
  return {
    root: true,
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
    ],
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 12,
      sourceType: "module",
    },
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "react", "react-hooks"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["warn"],
      "@typescript-eslint/no-parameter-properties": ["error"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "local",
          args: "after-used",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
      "react/react-in-jsx-scope": "off",
    },
    overrides: [
      {
        // Enable export/import for config files
        files: ["*.js", "*.cjs"],
        env: { node: true },
      },
    ],
    settings: { react: { version: "detect" } },
  };
}

exports.buildRules = buildRules;
