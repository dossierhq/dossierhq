import {
  IS_UNMERGEABLE,
  TEXT_TYPE_TO_FORMAT,
  type HeadingTagType,
  type TextFormatType,
} from '../third-party/Lexical.js';
import {
  RichTextNodeType,
  type EntityReference,
  type RichText,
  type RichTextEntityLinkNode,
  type RichTextEntityNode,
  type RichTextHeadingNode,
  type RichTextLineBreakNode,
  type RichTextListItemNode,
  type RichTextListNode,
  type RichTextNode,
  type RichTextParagraphNode,
  type RichTextTabNode,
  type RichTextTextNode,
  type RichTextComponentNode,
  type Component,
} from '../Types.js';

export function createRichText(children: RichTextNode[]): RichText {
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
  children: RichTextNode[],
): RichTextHeadingNode {
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

export function createRichTextParagraphNode(children: RichTextNode[]): RichTextParagraphNode {
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
  options?: { format?: TextFormatType[] },
): RichTextTextNode {
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

export function createRichTextLineBreakNode(): RichTextLineBreakNode {
  return { type: RichTextNodeType.linebreak, version: 1 };
}

export function createRichTextTabNode(): RichTextTabNode {
  return {
    detail: IS_UNMERGEABLE,
    format: 0,
    mode: 'normal',
    style: '',
    text: '\t',
    type: RichTextNodeType.tab,
    version: 1,
  };
}

export function createRichTextTextAndWhitespaceNodes(
  text: string,
  options?: { format?: TextFormatType[] },
): (RichTextTextNode | RichTextLineBreakNode)[] {
  if (!(text.includes('\n') || text.includes('\r') || text.includes('\t'))) {
    return [createRichTextTextNode(text, options)];
  }
  const linesOrNewline = text.replace(/\r[^\n]|\r$/g, '').split(/(\r?\n|\t)/);
  return linesOrNewline
    .filter((it) => it.length > 0)
    .map((it) => {
      if (it === '\r\n' || it === '\n') {
        return createRichTextLineBreakNode();
      } else if (it === '\t') {
        return createRichTextTabNode();
      }
      return createRichTextTextNode(it, options);
    });
}

export function createRichTextEntityNode(reference: EntityReference): RichTextEntityNode {
  const { id } = reference;
  return { type: RichTextNodeType.entity, format: '', reference: { id }, version: 1 };
}

export function createRichTextEntityLinkNode(
  reference: EntityReference,
  children: RichTextNode[],
): RichTextEntityLinkNode {
  const { id } = reference;
  return {
    direction: 'ltr',
    format: '',
    indent: 0,
    type: RichTextNodeType.entityLink,
    reference: { id },
    version: 1,
    children,
  };
}

export function createRichTextListNode(
  listType: RichTextListNode['listType'],
  children: RichTextNode[],
): RichTextListNode {
  return {
    direction: 'ltr',
    format: '',
    indent: 0,
    type: RichTextNodeType.list,
    version: 1,
    listType,
    start: 1,
    tag: listType === 'number' ? 'ol' : 'ul',
    children,
  };
}

export function createRichTextListItemNode(
  value: number,
  checked: boolean | undefined,
  children: RichTextNode[],
): RichTextListItemNode {
  return {
    direction: 'ltr',
    format: '',
    indent: 0,
    type: RichTextNodeType.listitem,
    version: 1,
    checked,
    value,
    children,
  };
}

export function createRichTextComponentNode<T extends Component<string, object>>(
  data: T,
): RichTextComponentNode {
  return { type: RichTextNodeType.component, data, format: '', version: 1 };
}

export function richTextTextNodeHasFormat(node: RichTextTextNode, format: TextFormatType): boolean {
  return (node.format & TEXT_TYPE_TO_FORMAT[format]) !== 0;
}
