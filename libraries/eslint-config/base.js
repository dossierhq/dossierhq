import pluginJs from "@eslint/js";
import turboPlugin from "eslint-plugin-turbo";
import globals from "globals";
import tsEslint from "typescript-eslint";

/** @import { Linter } from "eslint" */

/** @type {Linter.Config[]} */
export default [
  { ignores: ["node_modules/", "coverage/", "lib/"] },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    plugins: { turbo: { rules: turboPlugin.rules } },
    rules: { "turbo/no-undeclared-env-vars": "error" },
  },
  {
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
  },
];
