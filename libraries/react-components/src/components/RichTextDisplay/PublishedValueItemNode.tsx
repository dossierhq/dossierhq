import type { RichTextValueItemNode, ValueItem } from '@dossierhq/core';
import { createRichTextValueItemNode, RichTextNodeType } from '@dossierhq/core';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents.js';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { EditorConfig, ElementFormatType, LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import { useContext } from 'react';
import { PublishedDossierContext } from '../../published/contexts/PublishedDossierContext.js';
import { ValueTypeFieldDisplay } from '../EntityDisplay/ValueTypeFieldDisplay.js';
import { RichTextDisplayContext } from './RichTextDisplayContext.js';

export type SerializedPublishedValueItemNode = RichTextValueItemNode;

export function $createPublishedValueItemNode(data: ValueItem): PublishedValueItemNode {
  return new PublishedValueItemNode(data);
}

export function $isPublishedValueItemNode(
  node: LexicalNode | undefined | null
): node is PublishedValueItemNode {
  return node instanceof PublishedValueItemNode;
}

function PublishedValueItemComponent({
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
  const { fieldSpec } = useContext(RichTextDisplayContext);
  const { adapter } = useContext(PublishedDossierContext);

  const overriddenDisplay = adapter.renderPublishedRichTextValueItemDisplay({
    value: data,
  });

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {overriddenDisplay ?? (
        <ValueTypeFieldDisplay
          className="rich-text-item-indentation"
          fieldSpec={fieldSpec}
          value={data}
        />
      )}
    </BlockWithAlignableContents>
  );
}

export class PublishedValueItemNode extends DecoratorBlockNode {
  __data: ValueItem;

  static override getType(): string {
    return RichTextNodeType.valueItem;
  }

  static override clone(node: PublishedValueItemNode): PublishedValueItemNode {
    return new PublishedValueItemNode(node.__data, node.__format, node.__key);
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

  static override importJSON(
    serializedNode: SerializedPublishedValueItemNode
  ): PublishedValueItemNode {
    const node = $createPublishedValueItemNode(serializedNode.data);
    node.setFormat(serializedNode.format);
    return node;
  }

  override exportJSON(): SerializedPublishedValueItemNode {
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
      <PublishedValueItemComponent
        className={className}
        data={this.__data}
        format={this.__format}
        nodeKey={this.__key}
      />
    );
  }
}
