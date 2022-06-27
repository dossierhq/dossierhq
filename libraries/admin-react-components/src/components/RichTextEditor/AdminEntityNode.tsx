import type { EntityReference, RichTextEntityNode } from '@jonasb/datadata-core';
import { createRichTextEntityNode, RichTextNodeType } from '@jonasb/datadata-core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import type { LexicalCommand, LexicalNode, NodeKey } from 'lexical';
import { $getNodeByKey, createCommand, DecoratorNode } from 'lexical';
import { useCallback, useContext } from 'react';
import { EntityTypeFieldEditor } from '../EntityEditor/EntityTypeFieldEditor.js';
import { RichTextEditorContext } from './RichTextEditorContext.js';

export type SerializedAdminEntityNode = RichTextEntityNode;

export function $createAdminEntityNode(reference: EntityReference | null): AdminEntityNode {
  return new AdminEntityNode(reference);
}

export function $isAdminEntityNode(node: LexicalNode | undefined | null): node is AdminEntityNode {
  return node instanceof AdminEntityNode;
}

export const INSERT_ADMIN_ENTITY_COMMAND: LexicalCommand<void> = createCommand();

function AdminEntityComponent({
  nodeKey,
  reference,
}: {
  nodeKey: NodeKey;
  reference: EntityReference | null;
}) {
  const [editor] = useLexicalComposerContext();
  const { fieldSpec } = useContext(RichTextEditorContext);

  const setReference = useCallback(
    (value: EntityReference | null) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isAdminEntityNode(node)) {
          node.setReference(value);
        }
      });
    },
    [editor, nodeKey]
  );

  // TODO replace with display only (i.e. not an editor) and remove clear function
  return <EntityTypeFieldEditor fieldSpec={fieldSpec} value={reference} onChange={setReference} />;
}

export class AdminEntityNode extends DecoratorNode<JSX.Element> {
  __reference: EntityReference | null;

  static override getType(): string {
    return RichTextNodeType.entity;
  }

  static override clone(node: AdminEntityNode): AdminEntityNode {
    return new AdminEntityNode(node.__reference, node.__key);
  }

  constructor(reference: EntityReference | null, key?: NodeKey) {
    super(key);
    this.__reference = reference;
  }

  setReference(reference: EntityReference | null) {
    const self = this.getWritable();
    self.__reference = reference;
  }

  getReference(): EntityReference | null {
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
