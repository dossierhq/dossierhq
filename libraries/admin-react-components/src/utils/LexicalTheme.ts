import { ClassName } from '@jonasb/datadata-design';
import type { EditorThemeClasses } from 'lexical/LexicalEditor.js';

export const LexicalTheme: EditorThemeClasses = {
  text: {
    bold: ClassName['is-bold'],
    code: ClassName['is-code'],
    italic: ClassName['is-italic'],
    strikethrough: ClassName['is-strike-through'],
    subscript: ClassName['is-subscript'],
    superscript: ClassName['is-superscript'],
    underline: ClassName['is-underline'],
    underlineStrikethrough: ClassName['is-underline-strike-through'],
  },
};
