import type {
  AdminSchema,
  PublishValidationError,
  RichTextValueItemNode,
  SaveValidationError,
  ValueItem,
} from '@dossierhq/core';
import {
  createRichTextValueItemNode,
  normalizeValueItem,
  RichTextNodeType,
  traverseValueItem,
  validateTraverseNodeForPublish,
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
import { useCallback, useContext, useMemo } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { ValueItemFieldEditorWithoutClear } from '../EntityEditor/ValueItemFieldEditor.js';
import { RichTextEditorContext } from './RichTextEditorContext.js';

export type SerializedAdminValueItemNode = RichTextValueItemNode;

type ValidationError = SaveValidationError | PublishValidationError;

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
  const { adapter, schema: adminSchema } = useContext(AdminDossierContext);
  const { adminOnly: richTextAdminOnly } = useContext(RichTextEditorContext);
  const valueSpec = adminSchema?.getValueTypeSpecification(data.type);
  const adminOnly = richTextAdminOnly || !!valueSpec?.adminOnly;

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

  const validationErrors = useMemo(() => {
    return validateItemValue(adminSchema, adminOnly, data);
  }, [adminSchema, adminOnly, data]);

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
          adminOnly={adminOnly}
          value={data}
          validationErrors={validationErrors}
          onChange={setValue}
        />
      )}
    </BlockWithAlignableContents>
  );
}

// TODO this is duplicated from the validation in validateField() in EntityEditorReducer
// the main reason is that it's tricky to match the `path` in those validation errors with a certain
// rich text node. We most likely need to change that validation to use the Lexical nodes instead
// (as opposed to the serialized nodes which lack the node key)
// Hopefully we can get rid on RichTextEditorContext and `adminOnly` parameters to the field editors
function validateItemValue(
  adminSchema: AdminSchema | undefined,
  adminOnly: boolean,
  value: ValueItem
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (adminSchema) {
    const normalizeResult = normalizeValueItem(adminSchema, value);
    const valueToValidate = normalizeResult.isOk() ? normalizeResult.value : value;
    for (const node of traverseValueItem(adminSchema, [], valueToValidate)) {
      const error = validateTraverseNodeForSave(adminSchema, node);
      if (error) {
        errors.push(error);
      }
    }
    if (!adminOnly) {
      const publishedSchema = adminSchema.toPublishedSchema();
      for (const node of traverseValueItem(publishedSchema, [], valueToValidate)) {
        const error = validateTraverseNodeForPublish(adminSchema, node);
        if (error) {
          errors.push(error);
        }
      }
    }
  }
  return errors;
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
