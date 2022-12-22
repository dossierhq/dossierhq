import { LexicalTheme } from '@jonasb/datadata-design-server';
import { toTextStyleClassName } from '@jonasb/datadata-design-server';
import type { EditorThemeClasses } from 'lexical';

export const ArticleLexicalTheme: EditorThemeClasses = {
  ...LexicalTheme,
  heading: {
    ...LexicalTheme.heading,
    // The page heading is headline3
    h1: toTextStyleClassName('headline4'),
    h2: toTextStyleClassName('headline5'),
  },
};
