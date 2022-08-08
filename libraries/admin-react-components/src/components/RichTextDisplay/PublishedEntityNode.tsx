import type { EntityReference, RichTextEntityNode } from '@jonasb/datadata-core';
import { createRichTextEntityNode, RichTextNodeType } from '@jonasb/datadata-core';
import type { LexicalNode, NodeKey } from 'lexical';
import { DecoratorNode } from 'lexical';
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
  nodeKey: _,
  reference,
}: {
  nodeKey: NodeKey;
  reference: EntityReference;
}) {
  const { fieldSpec } = useContext(RichTextDisplayContext);

  return <EntityTypeFieldDisplay fieldSpec={fieldSpec} value={reference} />;
}

export class PublishedEntityNode extends DecoratorNode<JSX.Element> {
  __reference: EntityReference;

  static override getType(): string {
    return RichTextNodeType.entity;
  }

  static override clone(node: PublishedEntityNode): PublishedEntityNode {
    return new PublishedEntityNode(node.__reference, node.__key);
  }

  constructor(reference: EntityReference, key?: NodeKey) {
    super(key);
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
    return node;
  }

  override exportJSON(): SerializedPublishedEntityNode {
    return createRichTextEntityNode(this.__reference);
  }

  override createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  override updateDOM(_prevNode: PublishedEntityNode, _dom: HTMLElement): boolean {
    return false; // no need to recreate the DOM
  }

  override getTextContent(): '\n' {
    return '\n';
  }

  override isTopLevel(): true {
    return true;
  }

  override decorate(): JSX.Element {
    return <PublishedEntityComponent reference={this.__reference} nodeKey={this.__key} />;
  }
}
