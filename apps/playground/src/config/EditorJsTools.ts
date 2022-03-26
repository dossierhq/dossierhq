import type { EditorJsToolConstructable } from '@jonasb/datadata-admin-react-components';

const blockTools: { [toolName: string]: EditorJsToolConstructable } = {};

const inlineTools: { [toolName: string]: EditorJsToolConstructable } = {};

export const EditorJsTools = { blockTools, inlineTools };
