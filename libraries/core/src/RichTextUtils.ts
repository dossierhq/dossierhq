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
  RichTextEntityLinkNode,
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
  return { type: RichTextNodeType.entity, format: '', reference, version: 1 };
}

export function createRichTextEntityLinkNode(
  reference: EntityReference,
  children: RichTextNode[]
): RichTextEntityLinkNode {
  return {
    direction: 'ltr',
    format: '',
    indent: 0,
    type: RichTextNodeType.entityLink,
    reference,
    version: 1,
    children,
  };
}

export function createRichTextValueItemNode<T extends ValueItem<string, object>>(
  data: T
): RichTextValueItemNode {
  return { type: RichTextNodeType.valueItem, data, format: '', version: 1 };
}

export function richTextTextNodeHasFormat(
  node: SerializedTextNode,
  format: TextFormatType
): boolean {
  return (node.format & TEXT_TYPE_TO_FORMAT[format]) !== 0;
}
