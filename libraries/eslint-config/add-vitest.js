import vitest from "@vitest/eslint-plugin";

/** @import { Linter } from "eslint" */

/** @type {Linter.Config[]} */
export default [
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "assert*",
            "expect*",
          ],
        },
      ],
    },
  },
];
