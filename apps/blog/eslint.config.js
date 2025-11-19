import sharedConfig from '@dossierhq/eslint-config/next.js';

/** @import { Linter } from "eslint" */
/** @type {Linter.Config[]} */
export default [...sharedConfig, { ignores: ['public/*.js', 'next-env.d.ts'] }];
