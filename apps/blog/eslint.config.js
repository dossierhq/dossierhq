import vitestConfig from '@dossierhq/eslint-config/add-vitest.js';
import sharedConfig from '@dossierhq/eslint-config/next.js';

/** @import { Linter } from "eslint" */
/** @type {Linter.Config[]} */
export default [...sharedConfig, ...vitestConfig, { ignores: ['public/*.js'] }];
