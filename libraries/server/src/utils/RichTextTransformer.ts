import {
  isRichTextElementNode,
  isRichTextParagraphNode,
  isRichTextRootNode,
  notOk,
  ok,
  type ErrorType,
  type ItemValuePath,
  type Result,
  type RichText,
  type RichTextElementNode,
  type RichTextNode,
} from '@dossierhq/core';

export type RichTextNodeTransformer<TError extends ErrorType> = (
  path: ItemValuePath,
  node: Readonly<RichTextNode>,
) => Result<Readonly<RichTextNode | null>, TError>;

export function transformRichText<
  T extends Readonly<RichText> | RichText,
  TError extends ErrorType,
>(
  path: ItemValuePath,
  richText: T,
  transformer: RichTextNodeTransformer<TError>,
): Result<T | null, TError | typeof ErrorType.Generic> {
  const transformResult = transformNode(path, richText.root, transformer);
  if (transformResult.isError()) return transformResult;
  const newRoot = transformResult.value;

  if (newRoot === null) return ok(null);

  if (!isRichTextRootNode(newRoot)) {
    return notOk.Generic('Rich text transformer didn’t return a root node');
  }

  // normalize empty rich text
  if (
    newRoot.children.length === 0 ||
    (newRoot.children.length === 1 &&
      isRichTextParagraphNode(newRoot.children[0]) &&
      newRoot.children[0].children.length === 0)
  ) {
    return ok(null);
  }

  if (newRoot === richText.root) {
    return ok(richText);
  }
  return ok({ ...richText, root: newRoot });
}

function transformNode<TError extends ErrorType>(
  path: ItemValuePath,
  node: Readonly<RichTextNode>,
  transformer: RichTextNodeTransformer<TError>,
): Result<Readonly<RichTextNode | null>, TError> {
  const transformResult = transformer(path, node);
  if (transformResult.isError()) return transformResult;
  const newNode = transformResult.value;

  if (!newNode || !isRichTextElementNode(newNode)) {
    return ok(newNode);
  }

  const newChildren: RichTextNode[] = [];
  let childrenHasChanged = false;
  for (let index = 0; index < newNode.children.length; index += 1) {
    const child = newNode.children[index];
    const childPath = [...path, index];

    const childResult = transformNode(childPath, child, transformer);
    if (childResult.isError()) return childResult;
    const newChild = childResult.value;

    if (newChild !== child) {
      childrenHasChanged = true;
    }
    if (newChild) {
      newChildren.push(newChild);
    }
  }
  if (!childrenHasChanged) {
    return ok(newNode);
  }
  return ok({ ...newNode, children: newChildren } as RichTextElementNode);
}
