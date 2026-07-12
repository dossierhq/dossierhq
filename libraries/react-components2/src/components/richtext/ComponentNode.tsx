import {
  createRichTextComponentNode,
  normalizeComponent,
  RichTextNodeType,
  traverseComponent,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
  type Component,
  type ComponentFieldSpecification,
  type PublishValidationIssue,
  type RichTextComponentNode,
  type SaveValidationIssue,
  type Schema,
} from '@dossierhq/core';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents.js';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable.js';
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
import { useCallback, useContext, useMemo, type JSX } from 'react';
import { DossierContext } from '../../contexts/DossierContext.js';
import { useSchema } from '../../hooks/useSchema.js';
import { ComponentFieldDisplay } from '../ComponentFieldDisplay.js';
import { ComponentFieldEditorWithoutClear } from '../ComponentFieldEditor.js';
import { RichTextEditorContext } from './RichTextEditorContext.js';

type SerializedComponentNode = RichTextComponentNode;

type ValidationIssue = SaveValidationIssue | PublishValidationIssue;

export function $createComponentNode(data: Component): ComponentNode {
  return new ComponentNode(data);
}

export function $isComponentNode(node: LexicalNode | undefined | null): node is ComponentNode {
  return node instanceof ComponentNode;
}

export const INSERT_COMPONENT_COMMAND: LexicalCommand<Component> = createCommand();

function ComponentNodeComponent({
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
  const isEditable = useLexicalEditable();
  const { adapter } = useContext(DossierContext);
  const { schema } = useSchema();
  const { adminOnly: richTextAdminOnly } = useContext(RichTextEditorContext);
  const componentSpec = schema?.getComponentTypeSpecification(data.type);
  const adminOnly = richTextAdminOnly || !!componentSpec?.adminOnly;

  const setValue = useCallback(
    (value: Component) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isComponentNode(node)) {
          node.setData(value);
        }
      });
    },
    [editor, nodeKey],
  );

  const validationIssues = useMemo(() => {
    return isEditable ? validateComponent(schema, adminOnly, data) : [];
  }, [isEditable, schema, adminOnly, data]);

  let content;
  if (isEditable) {
    const overriddenEditor = adapter?.renderRichTextComponentEditor?.({
      value: data,
      validationIssues,
      onChange: setValue,
    });
    content = overriddenEditor ?? (
      <ComponentFieldEditorWithoutClear
        adminOnly={adminOnly}
        value={data}
        validationIssues={validationIssues}
        onChange={setValue}
      />
    );
  } else {
    const overriddenDisplay = adapter?.renderRichTextComponentDisplay?.({ value: data });
    content = overriddenDisplay ?? (
      <ComponentFieldDisplay
        // ComponentFieldDisplay doesn't use the field spec, only the value
        fieldSpec={undefined as unknown as ComponentFieldSpecification}
        value={data}
      />
    );
  }

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {content}
    </BlockWithAlignableContents>
  );
}

// TODO this is duplicated from the validation in validateField() in ContentEditorReducer
// the main reason is that it's tricky to match the `path` in those validation issues with a certain
// rich text node. We most likely need to change that validation to use the Lexical nodes instead
// (as opposed to the serialized nodes which lack the node key)
// Hopefully we can get rid of RichTextEditorContext and `adminOnly` parameters to the field editors
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

export class ComponentNode extends DecoratorBlockNode {
  __data: Component;

  static override getType(): string {
    return RichTextNodeType.component;
  }

  static override clone(node: ComponentNode): ComponentNode {
    return new ComponentNode(node.__data, node.__format, node.__key);
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

  static override importJSON(serializedNode: SerializedComponentNode): ComponentNode {
    const node = $createComponentNode(serializedNode.data);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedComponentNode {
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
      <ComponentNodeComponent
        className={className}
        data={this.__data}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
