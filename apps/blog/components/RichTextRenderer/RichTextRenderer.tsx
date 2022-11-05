import type { RichText, RichTextElementNode, RichTextNode } from '@jonasb/datadata-core';
import {
  isRichTextElementNode,
  isRichTextParagraphNode,
  isRichTextRootNode,
  isRichTextTextNode,
} from '@jonasb/datadata-core';
import { Text } from '@jonasb/datadata-design';
import type { Key, ReactNode } from 'react';

interface Props {
  richText: RichText;
}

export function RichTextRenderer({ richText }: Props): JSX.Element {
  const rendered = renderNode(richText.root, null);
  return rendered as JSX.Element;
}

function renderNode(node: RichTextNode, key: Key | null): ReactNode {
  if (isRichTextRootNode(node)) {
    return renderChildren(node);
  }
  if (isRichTextParagraphNode(node)) {
    return (
      <Text key={key} textStyle="body1">
        {renderChildren(node)}
      </Text>
    );
  }
  if (isRichTextTextNode(node)) {
    return node.text;
  }
  if (isRichTextElementNode(node)) {
    // fallback for unknown element nodes
    return renderChildren(node);
  }
  return null;
}

function renderChildren(node: RichTextElementNode): ReactNode {
  return node.children.map((child, index) => renderNode(child, index));
}
