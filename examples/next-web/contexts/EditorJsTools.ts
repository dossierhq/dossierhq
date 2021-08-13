import type { EditorJsToolConstructable } from '@jonasb/datadata-admin-react-components';
import Checklist from '@editorjs/checklist';
import Header from '@editorjs/header';
import InlineCode from '@editorjs/inline-code';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Underline from '@editorjs/underline';

const blockTools: { [toolName: string]: EditorJsToolConstructable } = {
  checklist: Checklist,
  header: Header,
  list: List,
  quote: Quote,
};

const inlineTools: { [toolName: string]: EditorJsToolConstructable } = {
  inlineCode: InlineCode,
  underline: Underline,
};

export const EditorJsTools = { blockTools, inlineTools };
