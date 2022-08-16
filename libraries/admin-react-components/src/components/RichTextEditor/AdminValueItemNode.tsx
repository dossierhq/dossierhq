import type { RichTextValueItemNode, ValueItem } from '@jonasb/datadata-core';
import { createRichTextValueItemNode, RichTextNodeType } from '@jonasb/datadata-core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import type { LexicalCommand, LexicalNode, NodeKey } from 'lexical';
import { $getNodeByKey, createCommand, DecoratorNode } from 'lexical';
import { useCallback } from 'react';
import { ValueItemFieldEditorWithoutClear } from '../EntityEditor/ValueTypeFieldEditor.js';

export type SerializedAdminValueItemNode = RichTextValueItemNode;

export function $createAdminValueItemNode(data: ValueItem): AdminValueItemNode {
  return new AdminValueItemNode(data);
}

export function $isAdminValueItemNode(
  node: LexicalNode | undefined | null
): node is AdminValueItemNode {
  return node instanceof AdminValueItemNode;
}

export const INSERT_ADMIN_VALUE_ITEM_COMMAND: LexicalCommand<ValueItem> = createCommand();

function AdminValueItemComponent({ nodeKey, data }: { nodeKey: NodeKey; data: ValueItem }) {
  const [editor] = useLexicalComposerContext();

  const setValue = useCallback(
    (value: ValueItem) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isAdminValueItemNode(node)) {
          node.setData(value);
        }
      });
    },
    [editor, nodeKey]
  );

  return (
    <ValueItemFieldEditorWithoutClear
      className="rich-text-item-indentation"
      value={data}
      onChange={setValue}
    />
  );
}

export class AdminValueItemNode extends DecoratorNode<JSX.Element> {
  __data: ValueItem;

  static override getType(): string {
    return RichTextNodeType.valueItem;
  }

  static override clone(node: AdminValueItemNode): AdminValueItemNode {
    return new AdminValueItemNode(node.__data, node.__key);
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

  static override importJSON(serializedNode: SerializedAdminValueItemNode): AdminValueItemNode {
    const node = $createAdminValueItemNode(serializedNode.data);
    return node;
  }

  override exportJSON(): SerializedAdminValueItemNode {
    return createRichTextValueItemNode(this.__data);
  }

  override createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  override updateDOM(_prevNode: AdminValueItemNode, _dom: HTMLElement): boolean {
    return false; // no need to recreate the DOM
  }

  override getTextContent(): '\n' {
    return '\n';
  }

  override isTopLevel(): true {
    return true;
  }

  override decorate(): JSX.Element {
    return <AdminValueItemComponent data={this.__data} nodeKey={this.__key} />;
  }
}
