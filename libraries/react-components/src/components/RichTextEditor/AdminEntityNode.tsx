import type { EntityReference, RichTextEntityNode } from '@dossierhq/core';
import { RichTextNodeType, createRichTextEntityNode } from '@dossierhq/core';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type {
  EditorConfig,
  ElementFormatType,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
} from 'lexical';
import { createCommand } from 'lexical';
import { ReferenceFieldEditorWithoutClear } from '../EntityEditor/ReferenceFieldEditor.js';

export type SerializedAdminEntityNode = RichTextEntityNode;

export function $createAdminEntityNode(reference: EntityReference): AdminEntityNode {
  return new AdminEntityNode(reference);
}

export function $isAdminEntityNode(node: LexicalNode | undefined | null): node is AdminEntityNode {
  return node instanceof AdminEntityNode;
}

export const INSERT_ADMIN_ENTITY_COMMAND: LexicalCommand<EntityReference> = createCommand();

function AdminEntityComponent({
  className,
  format,
  nodeKey,
  reference,
}: {
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  reference: EntityReference;
}) {
  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <ReferenceFieldEditorWithoutClear className="rich-text-item-indentation" value={reference} />
    </BlockWithAlignableContents>
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

  override decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };

    return (
      <AdminEntityComponent
        className={className}
        reference={this.__reference}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
