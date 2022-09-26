import type { EntityReference, RichTextEntityNode } from '@jonasb/datadata-core';
import { createRichTextEntityNode, RichTextNodeType } from '@jonasb/datadata-core';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import type { ElementFormatType, LexicalCommand, LexicalNode, NodeKey } from 'lexical';
import { createCommand } from 'lexical';
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
  format: _1,
  nodeKey: _2,
  reference,
}: {
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  reference: EntityReference;
}) {
  return (
    <EntityTypeFieldEditorWithoutClear className="rich-text-item-indentation" value={reference} />
  );
}

export class AdminEntityNode extends DecoratorBlockNode {
  __reference: EntityReference;

  static override getType(): string {
    return RichTextNodeType.entity;
  }

  static override clone(node: AdminEntityNode): AdminEntityNode {
    return new AdminEntityNode(node.__reference, node.__format, node.__key);
  }

  constructor(reference: EntityReference, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
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
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedAdminEntityNode {
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
      <AdminEntityComponent
        reference={this.__reference}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
