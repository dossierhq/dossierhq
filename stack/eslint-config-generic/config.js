function buildRules(profile) {
  return {
    root: true,
    env: {
      browser: true,
      es2023: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended-type-checked",
      "plugin:@typescript-eslint/stylistic-type-checked",
    ],
    parserOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      project: true,
    },
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["warn"],
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
    },
    overrides: [
      {
        // Enable export/import for config files
        files: ["*.js", "*.cjs"],
        env: { node: true },
      },
    ],
  };
}

exports.buildRules = buildRules;
