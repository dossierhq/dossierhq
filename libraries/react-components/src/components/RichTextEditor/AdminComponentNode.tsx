import {
  createRichTextComponentNode,
  normalizeComponent,
  RichTextNodeType,
  traverseComponent,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
  type Component,
  type PublishValidationIssue,
  type RichTextComponentNode,
  type SaveValidationIssue,
  type Schema,
} from '@dossierhq/core';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents.js';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import {
  $getNodeByKey,
  createCommand,
  type EditorConfig,
  type ElementFormatType,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
} from 'lexical';
import { useCallback, useContext, useMemo } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { ComponentFieldEditorWithoutClear } from '../EntityEditor/ComponentFieldEditor.js';
import { RichTextEditorContext } from './RichTextEditorContext.js';

export type SerializedAdminComponentNode = RichTextComponentNode;

type ValidationIssue = SaveValidationIssue | PublishValidationIssue;

export function $createAdminComponentNode(data: Component): AdminComponentNode {
  return new AdminComponentNode(data);
}

export function $isAdminComponentNode(
  node: LexicalNode | undefined | null,
): node is AdminComponentNode {
  return node instanceof AdminComponentNode;
}

export const INSERT_ADMIN_COMPONENT_COMMAND: LexicalCommand<Component> = createCommand();

function AdminComponentComponent({
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
  data: Component;
}) {
  const [editor] = useLexicalComposerContext();
  const { adapter, schema: schema } = useContext(AdminDossierContext);
  const { adminOnly: richTextAdminOnly } = useContext(RichTextEditorContext);
  const componentSpec = schema?.getComponentTypeSpecification(data.type);
  const adminOnly = richTextAdminOnly || !!componentSpec?.adminOnly;

  const setValue = useCallback(
    (value: Component) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isAdminComponentNode(node)) {
          node.setData(value);
        }
      });
    },
    [editor, nodeKey],
  );

  const validationIssues = useMemo(() => {
    return validateComponent(schema, adminOnly, data);
  }, [schema, adminOnly, data]);

  const overriddenEditor = adapter.renderAdminRichTextComponentEditor({
    value: data,
    validationIssues,
    onChange: setValue,
  });

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {overriddenEditor ?? (
        <ComponentFieldEditorWithoutClear
          className="rich-text-item-indentation"
          adminOnly={adminOnly}
          value={data}
          validationIssues={validationIssues}
          onChange={setValue}
        />
      )}
    </BlockWithAlignableContents>
  );
}

// TODO this is duplicated from the validation in validateField() in EntityEditorReducer
// the main reason is that it's tricky to match the `path` in those validation issues with a certain
// rich text node. We most likely need to change that validation to use the Lexical nodes instead
// (as opposed to the serialized nodes which lack the node key)
// Hopefully we can get rid on RichTextEditorContext and `adminOnly` parameters to the field editors
function validateComponent(
  schema: Schema | undefined,
  adminOnly: boolean,
  value: Component,
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (schema) {
    const normalizeResult = normalizeComponent(schema, [], value);
    const valueToValidate = normalizeResult.isOk() ? normalizeResult.value : value;
    for (const node of traverseComponent(schema, [], valueToValidate)) {
      const error = validateTraverseNodeForSave(schema, node);
      if (error) {
        errors.push(error);
      }
    }
    if (!adminOnly) {
      const publishedSchema = schema.toPublishedSchema();
      for (const node of traverseComponent(publishedSchema, [], valueToValidate)) {
        const error = validateTraverseNodeForPublish(schema, node);
        if (error) {
          errors.push(error);
        }
      }
    }
  }
  return errors;
}

export class AdminComponentNode extends DecoratorBlockNode {
  __data: Component;

  static override getType(): string {
    return RichTextNodeType.component;
  }

  static override clone(node: AdminComponentNode): AdminComponentNode {
    return new AdminComponentNode(node.__data, node.__format, node.__key);
  }

  constructor(data: Component, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__data = data;
  }

  setData(data: Component) {
    const self = this.getWritable();
    self.__data = data;
  }

  getData(): Component {
    const self = this.getLatest();
    return self.__data;
  }

  static override importJSON(serializedNode: SerializedAdminComponentNode): AdminComponentNode {
    const node = $createAdminComponentNode(serializedNode.data);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedAdminComponentNode {
    //TODO format
    return createRichTextComponentNode(this.__data);
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
      <AdminComponentComponent
        className={className}
        data={this.__data}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
