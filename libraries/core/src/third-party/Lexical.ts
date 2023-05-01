// from lexical

export type Spread<T1, T2> = Omit<T2, keyof T1> & T1;

export interface SerializedEditorState {
  root: SerializedRootNode;
}

export type SerializedRootNode = SerializedElementNode;

export type SerializedLexicalNode = {
  type: string;
  version: number;
};

type ElementFormatType = 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';

export type SerializedElementNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<
  {
    children: Array<T>;
    direction: 'ltr' | 'rtl' | null;
    format: ElementFormatType;
    indent: number;
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

export type SerializedLineBreakNode = SerializedLexicalNode;

export type SerializedParagraphNode = SerializedElementNode;

// Copy from LexicalConstants. Would be good to ensure they are identical to Lexical's constants but
// they are not exported and we don't want a runtime dependency on Lexical.
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_SUBSCRIPT = 1 << 5;
const IS_SUPERSCRIPT = 1 << 6;
const IS_HIGHLIGHT = 1 << 7;

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

export type SerializedCodeNode = Spread<
  { language: string | null | undefined },
  SerializedElementNode
>;

export type SerializedCodeHighlightNode = Spread<
  { highlightType: string | null | undefined },
  SerializedTextNode
>;

// from @lexical/link

export type LinkAttributes = {
  rel?: null | string;
  target?: null | string;
};

export type SerializedLinkNode = Spread<
  { url: string },
  Spread<LinkAttributes, SerializedElementNode>
>;

// from @lexical/list

export type SerializedListNode = Spread<
  { listType: ListType; start: number; tag: ListNodeTagType },
  SerializedElementNode
>;

export type ListType = 'number' | 'bullet' | 'check';

export type ListNodeTagType = 'ul' | 'ol';

export type SerializedListItemNode = Spread<
  {
    checked: boolean | undefined;
    value: number;
  },
  SerializedElementNode
>;

// from @lexical/react

export type SerializedDecoratorBlockNode = Spread<
  { format: ElementFormatType },
  SerializedLexicalNode
>;

// from @lexical/rich-text

export type HeadingTagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export declare type SerializedHeadingNode = Spread<
  { tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' },
  SerializedElementNode
>;
