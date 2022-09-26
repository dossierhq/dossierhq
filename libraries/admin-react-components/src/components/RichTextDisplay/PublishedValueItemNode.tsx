import type { RichTextValueItemNode, ValueItem } from '@jonasb/datadata-core';
import { createRichTextValueItemNode, RichTextNodeType } from '@jonasb/datadata-core';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { ElementFormatType, LexicalNode, NodeKey } from 'lexical';
import { useContext } from 'react';
import { ValueTypeFieldDisplay } from '../EntityDisplay/ValueTypeFieldDisplay.js';
import { RichTextDisplayContext } from './RichTextDisplayContext.js';

export type SerializedPublishedValueItemNode = RichTextValueItemNode;

export function $createPublishedValueItemNode(data: ValueItem): PublishedValueItemNode {
  return new PublishedValueItemNode(data);
}

export function $isPublishedValueItemNode(
  node: LexicalNode | undefined | null
): node is PublishedValueItemNode {
  return node instanceof PublishedValueItemNode;
}

function PublishedValueItemComponent({
  format: _1,
  nodeKey: _2,
  data,
}: {
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  data: ValueItem | null;
}) {
  const { fieldSpec } = useContext(RichTextDisplayContext);

  return (
    <ValueTypeFieldDisplay
      className="rich-text-item-indentation"
      fieldSpec={fieldSpec}
      value={data}
    />
  );
}

export class PublishedValueItemNode extends DecoratorBlockNode {
  __data: ValueItem;

  static override getType(): string {
    return RichTextNodeType.valueItem;
  }

  static override clone(node: PublishedValueItemNode): PublishedValueItemNode {
    return new PublishedValueItemNode(node.__data, node.__format, node.__key);
  }

  constructor(data: ValueItem, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__data = data;
  }

  setData(data: ValueItem) {
    const self = this.getWritable();
    self.__data = data;
  }

  getData(): ValueItem {
    const self = this.getLatest();
    return self.__data;
  }

  static override importJSON(
    serializedNode: SerializedPublishedValueItemNode
  ): PublishedValueItemNode {
    const node = $createPublishedValueItemNode(serializedNode.data);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedPublishedValueItemNode {
    //TODO format
    return createRichTextValueItemNode(this.__data);
  }

  override createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  override getTextContent(): '\n' {
    return '\n';
  }

  override isInline(): false {
    return false;
  }

  override decorate(): JSX.Element {
    return (
      <PublishedValueItemComponent data={this.__data} format={this.__format} nodeKey={this.__key} />
    );
  }
}
