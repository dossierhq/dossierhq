import {
  createRichTextEntityNode,
  RichTextNodeType,
  type EntityReference,
  type RichTextEntityNode,
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
import { XIcon } from 'lucide-react';
import { useCallback, useContext, type JSX } from 'react';
import { ContentEditorDispatchContext } from '../../contexts/ContentEditorDispatchContext.js';
import { useEntity } from '../../hooks/useEntity.js';
import { ContentEditorActions } from '../../reducers/ContentEditorReducer.js';
import { EntityCard } from '../EntityCard.js';
import { Button } from '../ui/button.js';

type SerializedEntityNode = RichTextEntityNode;

export function $createEntityNode(reference: EntityReference): EntityNode {
  return new EntityNode(reference);
}

export function $isEntityNode(node: LexicalNode | undefined | null): node is EntityNode {
  return node instanceof EntityNode;
}

export const INSERT_ENTITY_COMMAND: LexicalCommand<EntityReference> = createCommand();

function EntityNodeComponent({
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
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  const { entity } = useEntity(reference);

  const handleEntityClick = useCallback(() => {
    // open entity asynchronously to not fight with the "click to activate entity" functionality
    setTimeout(() =>
      dispatchContentEditor(new ContentEditorActions.AddDraft({ id: reference.id })),
    );
  }, [dispatchContentEditor, reference.id]);

  const handleRemove = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isEntityNode(node)) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  const entityCard = entity ? (
    <EntityCard
      className="grow"
      name={entity.info.name}
      status={entity.info.status}
      type={entity.info.type}
      valid={entity.info.valid && entity.info.validPublished !== false}
      onClick={isEditable ? handleEntityClick : undefined}
    />
  ) : (
    <div className="grow" />
  );

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {isEditable ? (
        <div className="group flex items-center gap-2">
          {entityCard}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove"
            className="size-6 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            onClick={handleRemove}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        entityCard
      )}
    </BlockWithAlignableContents>
  );
}

export class EntityNode extends DecoratorBlockNode {
  __reference: EntityReference;

  static override getType(): string {
    return RichTextNodeType.entity;
  }

  static override clone(node: EntityNode): EntityNode {
    return new EntityNode(node.__reference, node.__format, node.__key);
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

  static override importJSON(serializedNode: SerializedEntityNode): EntityNode {
    const node = $createEntityNode(serializedNode.reference);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedEntityNode {
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
      <EntityNodeComponent
        className={className}
        reference={this.__reference}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
