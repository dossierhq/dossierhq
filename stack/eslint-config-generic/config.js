function buildRules(profile) {
  return {
    root: true,
    env: {
      browser: true,
      es2021: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: "module",
      project: ["./tsconfig.json"],
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
