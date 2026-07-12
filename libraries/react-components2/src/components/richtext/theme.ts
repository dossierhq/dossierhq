import type { EditorThemeClasses } from 'lexical';

// Code highlight token classes (Prism token name -> Tailwind classes). Grouping matches
// the LexicalTheme in @dossierhq/design, which in turn matches the Lexical playground.
const tokenComment = 'text-slate-500 dark:text-slate-400';
const tokenPunctuation = 'text-slate-400 dark:text-slate-500';
const tokenProperty = 'text-pink-700 dark:text-pink-400';
const tokenSelector = 'text-lime-700 dark:text-lime-400';
const tokenOperator = 'text-amber-700 dark:text-amber-500';
const tokenAttr = 'text-sky-700 dark:text-sky-400';
const tokenVariable = 'text-orange-600 dark:text-orange-400';
const tokenFunction = 'text-rose-600 dark:text-rose-400';

const checkListItemBase =
  'relative mx-2 list-none px-6 outline-none before:absolute before:top-1 before:left-0 before:block before:size-4 before:cursor-pointer before:rounded-sm before:border before:content-[""] focus:before:ring-2 focus:before:ring-ring';

/** Corresponds to the EditorThemeClasses type in lexical, mirroring the keys that the
 * LexicalTheme in @dossierhq/design provides, but with Tailwind utility classes. */
export const LexicalTheme: EditorThemeClasses = {
  blockCursor:
    'pointer-events-none absolute block after:absolute after:-top-0.5 after:block after:w-5 after:animate-pulse after:border-t after:border-foreground after:content-[""]',
  code: 'relative my-2 block overflow-x-auto rounded-md bg-muted p-2 pl-14 font-mono text-sm leading-relaxed [tab-size:2] before:absolute before:inset-y-0 before:left-0 before:min-w-9 before:whitespace-pre-wrap before:border-r before:border-border before:bg-foreground/5 before:p-2 before:text-right before:text-muted-foreground before:content-[attr(data-gutter)]',
  codeHighlight: {
    atrule: tokenAttr,
    attr: tokenAttr,
    boolean: tokenProperty,
    builtin: tokenSelector,
    cdata: tokenComment,
    char: tokenSelector,
    class: tokenFunction,
    'class-name': tokenFunction,
    comment: tokenComment,
    constant: tokenProperty,
    deleted: tokenProperty,
    doctype: tokenComment,
    entity: tokenOperator,
    function: tokenFunction,
    important: tokenVariable,
    inserted: tokenSelector,
    keyword: tokenAttr,
    namespace: tokenVariable,
    number: tokenProperty,
    operator: tokenOperator,
    prolog: tokenComment,
    property: tokenProperty,
    punctuation: tokenPunctuation,
    regex: tokenVariable,
    selector: tokenSelector,
    string: tokenSelector,
    symbol: tokenProperty,
    tag: tokenProperty,
    url: tokenOperator,
    variable: tokenVariable,
  },
  embedBlock: {
    base: 'my-2 select-none',
    focus: 'rounded-md outline-2 outline-ring',
  },
  heading: {
    h1: 'mt-3 mb-2 text-3xl font-semibold',
    h2: 'mt-3 mb-2 text-2xl font-semibold',
    h3: 'mt-2 mb-2 text-xl font-semibold',
    h4: 'mt-2 mb-2 text-lg font-semibold',
    h5: 'mt-2 mb-2 text-base font-semibold',
    h6: 'mt-2 mb-2 text-sm font-semibold',
  },
  link: 'cursor-pointer text-blue-600 underline dark:text-blue-400',
  list: {
    checklist: 'relative',
    listitem: 'mb-0.5',
    listitemChecked: `${checkListItemBase} line-through before:border-primary before:bg-primary after:absolute after:top-[7px] after:left-[7px] after:block after:h-1.5 after:w-[3px] after:rotate-45 after:cursor-pointer after:border-r-2 after:border-b-2 after:border-primary-foreground after:content-[""]`,
    listitemUnchecked: `${checkListItemBase} before:border-muted-foreground`,
    nested: {
      listitem: 'list-none',
    },
    ol: 'mb-2 ml-5 list-decimal',
    ul: 'mb-2 ml-4 list-disc',
  },
  paragraph: 'mb-2',
  text: {
    bold: 'font-bold',
    code: 'rounded-sm bg-muted px-1 py-0.5 font-mono text-[94%]',
    highlight: 'bg-primary/20',
    italic: 'italic',
    strikethrough: 'line-through',
    subscript: 'align-sub text-[0.8em]',
    superscript: 'align-super text-[0.8em]',
    underline: 'underline',
    underlineStrikethrough: '[text-decoration-line:underline_line-through]',
  },
};

/** Classes for the editable/read-only surface (the Lexical ContentEditable). Mirrors the
 * Textarea ui component, with rich text specifics added. */
export const CONTENT_EDITABLE_CLASS_NAME =
  'min-h-32 w-full resize-y overflow-auto rounded-md border border-input bg-transparent px-3 py-2 text-base whitespace-pre-wrap break-words shadow-xs transition-[color,box-shadow] outline-hidden select-text focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm [--lexical-indent-base-value:2rem]';
