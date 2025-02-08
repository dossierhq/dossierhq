import baseConfig from "./react-library.js";

/** @import { Linter } from "eslint" */

/** @type {Linter.Config[]} */
export default [...baseConfig, { ignores: ["dist/"] }];
