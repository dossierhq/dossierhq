import { RichTextNodeType } from './Schema.js';
import type {
  HeadingTagType,
  SerializedHeadingNode,
  SerializedParagraphNode,
  SerializedTextNode,
  TextFormatType,
} from './third-party/Lexical.js';
import { TEXT_TYPE_TO_FORMAT } from './third-party/Lexical.js';
import type {
  EntityReference,
  RichText,
  RichTextEntityNode,
  RichTextNode,
  RichTextValueItemNode,
  ValueItem,
} from './Types.js';

export function createRichTextRootNode(children: RichTextNode[]): RichText {
  return {
    root: {
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
      children,
    },
  };
}

export function createRichTextHeadingNode(
  tag: HeadingTagType,
  children: RichTextNode[]
): SerializedHeadingNode {
  return {
    direction: 'ltr',
    format: '',
    indent: 0,
    tag,
    type: 'heading',
    version: 1,
    children,
  };
}

export function createRichTextParagraphNode(children: RichTextNode[]): SerializedParagraphNode {
  return {
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
    children,
  };
}

export function createRichTextTextNode(
  text: string,
  options?: { format?: TextFormatType[] }
): SerializedTextNode {
  let formatValue = 0;
  if (options?.format) {
    for (const formatItem of options.format) {
      const formatFlag = TEXT_TYPE_TO_FORMAT[formatItem];
      if (formatFlag !== undefined) {
        formatValue |= formatFlag;
      }
    }
  }
  return {
    detail: 0,
    format: formatValue,
    mode: 'normal',
    style: '',
    text,
    type: 'text',
    version: 1,
  };
}

export function createRichTextEntityNode(reference: EntityReference): RichTextEntityNode {
  return { type: RichTextNodeType.entity, reference, version: 1 };
}

export function createRichTextValueItemNode<T extends ValueItem<string, object>>(
  data: T
): RichTextValueItemNode {
  return { type: RichTextNodeType.valueItem, data, version: 1 };
}
