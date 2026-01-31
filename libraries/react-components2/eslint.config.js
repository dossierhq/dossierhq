import reactCompilerConfig from '@dossierhq/eslint-config/add-react-compiler.js';
import storybookConfig from '@dossierhq/eslint-config/add-storybook.js';
import vitestConfig from '@dossierhq/eslint-config/add-vitest.js';
import sharedConfig from '@dossierhq/eslint-config/react-library.js';

/** @import { Linter } from "eslint" */
/** @type {Linter.Config[]} */
export default [...sharedConfig, ...vitestConfig, ...storybookConfig, ...reactCompilerConfig];
