import type { RichText, RichTextElementNode, RichTextNode } from '@dossierhq/core';
import { isRichTextElementNode } from '@dossierhq/core';

type RichTextNodeTransformer = (node: Readonly<RichTextNode>) => Readonly<RichTextNode>;

export function transformRichText<T extends Readonly<RichText> | RichText>(
  richText: T,
  transformer: RichTextNodeTransformer,
): T {
  const newRoot = transformNode(richText.root, transformer);
  if (newRoot === richText.root) {
    return richText;
  }
  return { ...richText, root: newRoot };
}

function transformNode(
  node: Readonly<RichTextNode>,
  transformer: RichTextNodeTransformer,
): Readonly<RichTextNode> {
  const newNode = transformer(node);
  if (!isRichTextElementNode(newNode)) {
    return newNode;
  }

  const newChildren: RichTextNode[] = [];
  let childrenHasChanged = false;
  for (const child of newNode.children) {
    const newChild = transformNode(child, transformer);
    if (newChild !== child) {
      childrenHasChanged = true;
    }
    newChildren.push(newChild);
  }
  if (!childrenHasChanged) {
    return newNode;
  }
  return { ...newNode, children: newChildren } as RichTextElementNode;
}
