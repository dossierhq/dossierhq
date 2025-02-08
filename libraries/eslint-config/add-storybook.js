import storybook from "eslint-plugin-storybook";

/** @import { Linter } from "eslint" */
/** @type {Linter.Config[]} */
export default [
  ...storybook.configs["flat/recommended"],
  { ignores: ["storybook-static"] },
];
