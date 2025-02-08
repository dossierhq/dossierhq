import sharedConfig from '@dossierhq/eslint-config/vite.js';
import reactCompiler from 'eslint-plugin-react-compiler';

/** @import { Linter } from "eslint" */
/** @type {Linter.Config[]} */
export default [...sharedConfig, reactCompiler.configs.recommended];
