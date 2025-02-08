import reactCompilerConfig from '@dossierhq/eslint-config/add-react-compiler.js';
import sharedConfig from '@dossierhq/eslint-config/vite.js';

/** @import { Linter } from "eslint" */
/** @type {Linter.Config[]} */
export default [...sharedConfig, ...reactCompilerConfig];
