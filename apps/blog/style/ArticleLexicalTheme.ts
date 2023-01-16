import { LexicalTheme } from '@dossierhq/design-ssr';
import { toTextStyleClassName } from '@dossierhq/design-ssr';
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
