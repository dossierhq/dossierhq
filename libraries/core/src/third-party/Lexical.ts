// from lexical

export type Spread<T1, T2> = Omit<T2, keyof T1> & T1;

export interface SerializedEditorState {
  root: SerializedRootNode;
}

type SerializedRootNode = SerializedElementNode;

export type SerializedLexicalNode = {
  type: string;
  version: number;
};

type ElementFormatType = 'left' | 'center' | 'right' | 'justify' | '';

export type SerializedElementNode = Spread<
  {
    children: Array<SerializedLexicalNode>;
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
  | 'code'
  | 'subscript'
  | 'superscript';
export type TextModeType = 'normal' | 'token' | 'segmented' | 'inert';

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

export type SerializedParagraphNode = Spread<
  {
    type: 'paragraph';
    version: 1;
  },
  SerializedElementNode
>;

// Copy from LexicalConstants. Would be good to ensure they are identical to Lexical's constants but
// they are not exported and we don't want a runtime dependency on Lexical.
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_SUBSCRIPT = 1 << 5;
const IS_SUPERSCRIPT = 1 << 6;

export const TEXT_TYPE_TO_FORMAT = {
  bold: IS_BOLD,
  code: IS_CODE,
  italic: IS_ITALIC,
  strikethrough: IS_STRIKETHROUGH,
  subscript: IS_SUBSCRIPT,
  superscript: IS_SUPERSCRIPT,
  underline: IS_UNDERLINE,
} as const;

// from @lexical/rich-text

// deno had issue resolving the types on skypack, so copy instead

export type HeadingTagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export declare type SerializedHeadingNode = Spread<
  {
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    type: 'heading';
    version: 1;
  },
  SerializedElementNode
>;
