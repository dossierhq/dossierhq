import { describe, test } from 'vitest';
import type { RichTextNode } from '../Types.js';
import {
  isRichTextCodeHighlightNode,
  isRichTextCodeNode,
  isRichTextEntityLinkNode,
  isRichTextEntityNode,
  isRichTextHeadingNode,
  isRichTextLineBreakNode,
  isRichTextLinkNode,
  isRichTextListItemNode,
  isRichTextListNode,
  isRichTextParagraphNode,
  isRichTextTabNode,
  isRichTextTextNode,
  isRichTextValueItemNode,
} from './ContentTypeUtils.js';

describe('isRichTextXxxNode', () => {
  test('all', () => {
    // checking that all the 'leaf' types are covered and are distinct
    const node: RichTextNode = { type: 'any', version: 1 };
    if (isRichTextTextNode(node)) {
      const _type: 'text' = node.type;
    } else if (isRichTextLineBreakNode(node)) {
      const _type: 'linebreak' = node.type;
    } else if (isRichTextTabNode(node)) {
      const _type: 'tab' = node.type;
    } else if (isRichTextParagraphNode(node)) {
      const _type: 'paragraph' = node.type;
    } else if (isRichTextEntityNode(node)) {
      const _type: 'entity' = node.type;
    } else if (isRichTextEntityLinkNode(node)) {
      const _type: 'entityLink' = node.type;
    } else if (isRichTextValueItemNode(node)) {
      const _type: 'valueItem' = node.type;
    } else if (isRichTextCodeNode(node)) {
      const _type: 'code' = node.type;
    } else if (isRichTextCodeHighlightNode(node)) {
      const _type: 'code-highlight' = node.type;
    } else if (isRichTextHeadingNode(node)) {
      const _type: 'heading' = node.type;
    } else if (isRichTextLinkNode(node)) {
      const _type: 'link' = node.type;
    } else if (isRichTextListNode(node)) {
      const _type: 'list' = node.type;
    } else if (isRichTextListItemNode(node)) {
      const _type: 'listitem' = node.type;
    }
  });
});
