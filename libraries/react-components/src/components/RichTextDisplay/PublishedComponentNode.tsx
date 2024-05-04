import {
  createRichTextComponentNode,
  RichTextNodeType,
  type Component,
  type RichTextComponentNode,
} from '@dossierhq/core';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { EditorConfig, ElementFormatType, LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import { useContext } from 'react';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { ComponentFieldDisplay } from '../EntityDisplay/ComponentFieldDisplay.js';
import { RichTextDisplayContext } from './RichTextDisplayContext.js';

export type SerializedPublishedComponentNode = RichTextComponentNode;

export function $createPublishedComponentNode(data: Component): PublishedComponentNode {
  return new PublishedComponentNode(data);
}

export function $isPublishedComponentNode(
  node: LexicalNode | undefined | null,
): node is PublishedComponentNode {
  return node instanceof PublishedComponentNode;
}

function PublishedComponentComponent({
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
  const { fieldSpec } = useContext(RichTextDisplayContext);
  const { adapter } = useContext(PublishedDossierContext);

  const overriddenDisplay = adapter.renderPublishedRichTextComponentDisplay({
    value: data,
  });

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {overriddenDisplay ?? (
        <ComponentFieldDisplay
          className="rich-text-item-indentation"
          fieldSpec={fieldSpec}
          value={data}
        />
      )}
    </BlockWithAlignableContents>
  );
}

export class PublishedComponentNode extends DecoratorBlockNode {
  __data: Component;

  static override getType(): string {
    return RichTextNodeType.component;
  }

  static override clone(node: PublishedComponentNode): PublishedComponentNode {
    return new PublishedComponentNode(node.__data, node.__format, node.__key);
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

  static override importJSON(
    serializedNode: SerializedPublishedComponentNode,
  ): PublishedComponentNode {
    const node = $createPublishedComponentNode(serializedNode.data);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedPublishedComponentNode {
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
      <PublishedComponentComponent
        className={className}
        data={this.__data}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
