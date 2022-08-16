import type { RichTextValueItemNode, ValueItem } from '@jonasb/datadata-core';
import { createRichTextValueItemNode, RichTextNodeType } from '@jonasb/datadata-core';
import type { LexicalNode, NodeKey } from 'lexical';
import { DecoratorNode } from 'lexical';
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
  nodeKey: _,
  data,
}: {
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

export class PublishedValueItemNode extends DecoratorNode<JSX.Element> {
  __data: ValueItem;

  static override getType(): string {
    return RichTextNodeType.valueItem;
  }

  static override clone(node: PublishedValueItemNode): PublishedValueItemNode {
    return new PublishedValueItemNode(node.__data, node.__key);
  }

  constructor(data: ValueItem, key?: NodeKey) {
    super(key);
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
    return node;
  }

  override exportJSON(): SerializedPublishedValueItemNode {
    return createRichTextValueItemNode(this.__data);
  }

  override createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  override updateDOM(_prevNode: PublishedValueItemNode, _dom: HTMLElement): boolean {
    return false; // no need to recreate the DOM
  }

  override getTextContent(): '\n' {
    return '\n';
  }

  override isTopLevel(): true {
    return true;
  }

  override decorate(): JSX.Element {
    return <PublishedValueItemComponent data={this.__data} nodeKey={this.__key} />;
  }
}
