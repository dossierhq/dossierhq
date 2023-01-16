import type { EntityReference, RichTextEntityNode } from '@dossierhq/core';
import { createRichTextEntityNode, RichTextNodeType } from '@dossierhq/core';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { EditorConfig, ElementFormatType, LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import { useContext } from 'react';
import { EntityTypeFieldDisplay } from '../EntityDisplay/EntityTypeFieldDisplay.js';
import { RichTextDisplayContext } from './RichTextDisplayContext.js';

export type SerializedPublishedEntityNode = RichTextEntityNode;

export function $createPublishedEntityNode(reference: EntityReference): PublishedEntityNode {
  return new PublishedEntityNode(reference);
}

export function $isPublishedEntityNode(
  node: LexicalNode | undefined | null
): node is PublishedEntityNode {
  return node instanceof PublishedEntityNode;
}

function PublishedEntityComponent({
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
  const { fieldSpec } = useContext(RichTextDisplayContext);

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <EntityTypeFieldDisplay
        className="rich-text-item-indentation"
        fieldSpec={fieldSpec}
        value={reference}
      />
    </BlockWithAlignableContents>
  );
}

export class PublishedEntityNode extends DecoratorBlockNode {
  __reference: EntityReference;

  static override getType(): string {
    return RichTextNodeType.entity;
  }

  static override clone(node: PublishedEntityNode): PublishedEntityNode {
    return new PublishedEntityNode(node.__reference, node.__format, node.__key);
  }

  constructor(reference: EntityReference, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__reference = reference;
  }

  setReference(reference: EntityReference) {
    const self = this.getWritable();
    self.__reference = reference;
  }

  getReference(): EntityReference | null {
    const self = this.getLatest();
    return self.__reference;
  }

  static override importJSON(serializedNode: SerializedPublishedEntityNode): PublishedEntityNode {
    const node = $createPublishedEntityNode(serializedNode.reference);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedPublishedEntityNode {
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

  override decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };

    return (
      <PublishedEntityComponent
        className={className}
        reference={this.__reference}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
