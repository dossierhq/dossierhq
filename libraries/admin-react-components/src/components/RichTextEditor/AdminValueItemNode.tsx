import type { RichTextValueItemNode, ValueItem } from '@jonasb/datadata-core';
import { createRichTextValueItemNode, RichTextNodeType } from '@jonasb/datadata-core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { ElementFormatType, LexicalCommand, LexicalNode, NodeKey } from 'lexical';
import { $getNodeByKey, createCommand } from 'lexical';
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

function AdminValueItemComponent({
  format: _,
  nodeKey,
  data,
}: {
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  data: ValueItem;
}) {
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

export class AdminValueItemNode extends DecoratorBlockNode {
  __data: ValueItem;

  static override getType(): string {
    return RichTextNodeType.valueItem;
  }

  static override clone(node: AdminValueItemNode): AdminValueItemNode {
    return new AdminValueItemNode(node.__data, node.__format, node.__key);
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

  static override importJSON(serializedNode: SerializedAdminValueItemNode): AdminValueItemNode {
    const node = $createAdminValueItemNode(serializedNode.data);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedAdminValueItemNode {
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
      <AdminValueItemComponent data={this.__data} format={this.__format} nodeKey={this.__key} />
    );
  }
}
