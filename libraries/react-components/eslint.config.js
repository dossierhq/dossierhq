import vitestConfig from '@dossierhq/eslint-config/add-vitest.js';
import storybookConfig from '@dossierhq/eslint-config/add-storybook.js';
import sharedConfig from '@dossierhq/eslint-config/react-library.js';

/** @import { Linter } from "eslint" */
/** @type {Linter.Config[]} */
export default [...sharedConfig, ...vitestConfig, ...storybookConfig, { ignores: ['.storybook/middleware.cjs'] }];
