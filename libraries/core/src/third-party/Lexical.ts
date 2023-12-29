// from lexical

// packages/lexical/src/LexicalEditor.ts

export type Spread<T1, T2> = Omit<T2, keyof T1> & T1;

// packages/lexical/src/LexicalEditorState.ts

export interface SerializedEditorState<T extends SerializedLexicalNode = SerializedLexicalNode> {
  root: SerializedRootNode<T>;
}

// packages/lexical/src/nodes/LexicalRootNode.ts

export type SerializedRootNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  SerializedElementNode<T>;

// packages/lexical/src/LexicalNode.ts

export interface SerializedLexicalNode {
  type: string;
  version: number;
}

// packages/lexical/src/nodes/LexicalElementNode.ts

export type SerializedElementNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<
  {
    children: T[];
    direction: 'ltr' | 'rtl' | null;
    format: ElementFormatType;
    indent: number;
  },
  SerializedLexicalNode
>;

type ElementFormatType = 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';

// packages/lexical/src/nodes/LexicalTextNode.ts

export type SerializedTextNode = Spread<
  {
    detail: number;
    format: number;
    mode: TextModeType;
    style: string;
    text: string;
  },
  SerializedLexicalNode
>;

export type TextFormatType =
  | 'bold'
  | 'underline'
  | 'strikethrough'
  | 'italic'
  | 'highlight'
  | 'code'
  | 'subscript'
  | 'superscript';

export type TextModeType = 'normal' | 'token' | 'segmented';

// packages/lexical/src/nodes/LexicalLineBreakNode.ts

export type SerializedLineBreakNode = SerializedLexicalNode;

// packages/lexical/src/nodes/LexicalParagraphNode.ts

export type SerializedParagraphNode = SerializedElementNode;

// packages/lexical/src/nodes/LexicalTabNode.ts

export type SerializedTabNode = SerializedTextNode;

// packages/lexical/src/LexicalConstants.ts

// Text node formatting
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;
const IS_CODE = 16;
const IS_SUBSCRIPT = 32;
const IS_SUPERSCRIPT = 64;
const IS_HIGHLIGHT = 128;

// Text node details
export const IS_DIRECTIONLESS = 1;
export const IS_UNMERGEABLE = 2;

// our own type, not from lexical
export const TEXT_TYPE_TO_FORMAT = {
  bold: IS_BOLD,
  code: IS_CODE,
  highlight: IS_HIGHLIGHT,
  italic: IS_ITALIC,
  strikethrough: IS_STRIKETHROUGH,
  subscript: IS_SUBSCRIPT,
  superscript: IS_SUPERSCRIPT,
  underline: IS_UNDERLINE,
} as const;

// from @lexical/code

// packages/lexical-code/src/CodeNode.ts

export type SerializedCodeNode = Spread<
  { language: string | null | undefined },
  SerializedElementNode
>;

// packages/lexical-code/src/CodeHighlightNode.ts

export type SerializedCodeHighlightNode = Spread<
  { highlightType: string | null | undefined },
  SerializedTextNode
>;

// from @lexical/link

// packages/lexical-link/src/index.ts

export interface LinkAttributes {
  rel?: null | string;
  target?: null | string;
  title?: null | string;
}

export type SerializedLinkNode = Spread<
  { url: string },
  Spread<LinkAttributes, SerializedElementNode>
>;

// from @lexical/list

// packages/lexical-list/src/LexicalListNode.ts

export type SerializedListNode = Spread<
  { listType: ListType; start: number; tag: ListNodeTagType },
  SerializedElementNode
>;

export type ListType = 'number' | 'bullet' | 'check';

export type ListNodeTagType = 'ul' | 'ol';

// packages/lexical-list/src/LexicalListItemNode.ts

export type SerializedListItemNode = Spread<
  { checked: boolean | undefined; value: number },
  SerializedElementNode
>;

// from @lexical/react

// packages/lexical-react/src/LexicalDecoratorBlockNode.ts

export type SerializedDecoratorBlockNode = Spread<
  { format: ElementFormatType },
  SerializedLexicalNode
>;

// from @lexical/rich-text

// packages/lexical-rich-text/src/index.ts

export declare type SerializedHeadingNode = Spread<
  { tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' },
  SerializedElementNode
>;

export type HeadingTagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
