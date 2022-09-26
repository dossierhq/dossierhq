import type { EntityReference, RichTextEntityNode } from '@jonasb/datadata-core';
import { createRichTextEntityNode, RichTextNodeType } from '@jonasb/datadata-core';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { ElementFormatType, LexicalNode, NodeKey } from 'lexical';
import { useContext } from 'react';
import { EntityTypeFieldDisplay } from '../EntityDisplay/EntityTypeFieldDisplay.js';
import { RichTextDisplayContext } from './RichTextDisplayContext.js';

export type SerializedPublishedEntityNode = RichTextEntityNode;

export function $createPublishedEntityNode(reference: EntityReference): PublishedEntityNode {
  return new PublishedEntityNode(reference);
}

export function $isPublishedEntityNode(
  node: LexicalNode | undefined | null
): node is PublishedEntityNode {
  return node instanceof PublishedEntityNode;
}

function PublishedEntityComponent({
  format: _1,
  nodeKey: _2,
  reference,
}: {
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  reference: EntityReference;
}) {
  const { fieldSpec } = useContext(RichTextDisplayContext);

  return (
    <EntityTypeFieldDisplay
      className="rich-text-item-indentation"
      fieldSpec={fieldSpec}
      value={reference}
    />
  );
}

export class PublishedEntityNode extends DecoratorBlockNode {
  __reference: EntityReference;

  static override getType(): string {
    return RichTextNodeType.entity;
  }

  static override clone(node: PublishedEntityNode): PublishedEntityNode {
    return new PublishedEntityNode(node.__reference, node.__format, node.__key);
  }

  constructor(reference: EntityReference, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__reference = reference;
  }

  setReference(reference: EntityReference) {
    const self = this.getWritable();
    self.__reference = reference;
  }

  getReference(): EntityReference | null {
    const self = this.getLatest();
    return self.__reference;
  }

  static override importJSON(serializedNode: SerializedPublishedEntityNode): PublishedEntityNode {
    const node = $createPublishedEntityNode(serializedNode.reference);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedPublishedEntityNode {
    //TODO format
    return createRichTextEntityNode(this.__reference);
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
      <PublishedEntityComponent
        reference={this.__reference}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
