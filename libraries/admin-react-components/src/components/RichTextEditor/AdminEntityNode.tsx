import type { EntityReference, RichTextEntityNode } from '@jonasb/datadata-core';
import { createRichTextEntityNode, RichTextNodeType } from '@jonasb/datadata-core';
import type { LexicalCommand, LexicalNode, NodeKey } from 'lexical';
import { createCommand, DecoratorNode } from 'lexical';
import { EntityTypeFieldEditorWithoutClear } from '../EntityEditor/EntityTypeFieldEditor.js';

export type SerializedAdminEntityNode = RichTextEntityNode;

export function $createAdminEntityNode(reference: EntityReference): AdminEntityNode {
  return new AdminEntityNode(reference);
}

export function $isAdminEntityNode(node: LexicalNode | undefined | null): node is AdminEntityNode {
  return node instanceof AdminEntityNode;
}

export const INSERT_ADMIN_ENTITY_COMMAND: LexicalCommand<EntityReference> = createCommand();

function AdminEntityComponent({
  nodeKey: _,
  reference,
}: {
  nodeKey: NodeKey;
  reference: EntityReference;
}) {
  return (
    <EntityTypeFieldEditorWithoutClear className="rich-text-item-indentation" value={reference} />
  );
}

export class AdminEntityNode extends DecoratorNode<JSX.Element> {
  __reference: EntityReference;

  static override getType(): string {
    return RichTextNodeType.entity;
  }

  static override clone(node: AdminEntityNode): AdminEntityNode {
    return new AdminEntityNode(node.__reference, node.__key);
  }

  constructor(reference: EntityReference, key?: NodeKey) {
    super(key);
    this.__reference = reference;
  }

  setReference(reference: EntityReference) {
    const self = this.getWritable();
    self.__reference = reference;
  }

  getReference(): EntityReference {
    const self = this.getLatest();
    return self.__reference;
  }

  static override importJSON(serializedNode: SerializedAdminEntityNode): AdminEntityNode {
    const node = $createAdminEntityNode(serializedNode.reference);
    return node;
  }

  override exportJSON(): SerializedAdminEntityNode {
    return createRichTextEntityNode(this.__reference);
  }

  override createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  override updateDOM(_prevNode: AdminEntityNode, _dom: HTMLElement): boolean {
    return false; // no need to recreate the DOM
  }

  override getTextContent(): '\n' {
    return '\n';
  }

  override isTopLevel(): true {
    return true;
  }

  override decorate(): JSX.Element {
    return <AdminEntityComponent reference={this.__reference} nodeKey={this.__key} />;
  }
}
