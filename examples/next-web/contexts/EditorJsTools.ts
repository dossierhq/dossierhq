import type { EditorJsToolConstructable } from '@datadata/admin-react-components';
import Checklist from '@editorjs/checklist';
import InlineCode from '@editorjs/inline-code';
import Header from '@editorjs/header';
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

export default { blockTools, inlineTools };
