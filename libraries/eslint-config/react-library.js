import pluginReact from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import libraryConfig from "./library.js";

/** @import { Linter } from "eslint" */

/** @type {Linter.Config[]} */
export default [
  ...libraryConfig,
  { settings: { react: { version: "19" } } },
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    plugins: { "react-hooks": hooksPlugin },
    rules: hooksPlugin.configs.recommended.rules,
  },
];
