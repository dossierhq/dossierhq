import type { RichTextValueItemNode, SaveValidationError, ValueItem } from '@dossierhq/core';
import {
  createRichTextValueItemNode,
  RichTextNodeType,
  traverseValueItem,
  validateTraverseNodeForSave,
} from '@dossierhq/core';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents.js';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type {
  EditorConfig,
  ElementFormatType,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
} from 'lexical';
import { $getNodeByKey, createCommand } from 'lexical';
import isEqual from 'lodash/isEqual.js';
import { useCallback, useContext, useState } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { ValueItemFieldEditorWithoutClear } from '../EntityEditor/ValueItemFieldEditor.js';

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
  className,
  format,
  nodeKey,
  data,
}: {
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  data: ValueItem;
}) {
  const [editor] = useLexicalComposerContext();
  const { adapter, schema } = useContext(AdminDossierContext);
  const [validationErrors, setValidationErrors] = useState<SaveValidationError[]>([]);

  const setValue = useCallback(
    (value: ValueItem) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isAdminValueItemNode(node)) {
          node.setData(value);
        }
      });

      const newValidationErrors: SaveValidationError[] = [];
      if (schema) {
        for (const node of traverseValueItem(schema, [], value)) {
          const error = validateTraverseNodeForSave(schema, node);
          if (error) {
            newValidationErrors.push(error);
          }
        }
        setValidationErrors((oldValidationErrors) =>
          isEqual(oldValidationErrors, newValidationErrors)
            ? oldValidationErrors
            : newValidationErrors
        );
      }
    },
    [editor, nodeKey, schema]
  );

  const overriddenEditor = adapter.renderAdminRichTextValueItemEditor({
    value: data,
    validationErrors,
    onChange: setValue,
  });

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {overriddenEditor ?? (
        <ValueItemFieldEditorWithoutClear
          className="rich-text-item-indentation"
          value={data}
          validationErrors={validationErrors}
          onChange={setValue}
        />
      )}
    </BlockWithAlignableContents>
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

  override decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };

    return (
      <AdminValueItemComponent
        className={className}
        data={this.__data}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
