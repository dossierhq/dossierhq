import {
  ErrorType,
  RichTextNodeType,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  ok,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { transformRichText } from './RichTextTransformer.js';
import { expectErrorResult } from '@dossierhq/core-vitest';

describe('transformRichText', () => {
  test('return null root', () => {
    expect(
      transformRichText(
        [],
        createRichTextRootNode([createRichTextParagraphNode([createRichTextTextNode('hello')])]),
        (_path, _node) => ok(null),
      ).valueOrThrow(),
    ).toEqual(null);
  });

  test('return empty document', () => {
    expect(
      transformRichText(
        [],
        createRichTextRootNode([createRichTextParagraphNode([createRichTextTextNode('hello')])]),
        (_path, node) => ok(node.type === RichTextNodeType.text ? null : node),
      ).valueOrThrow(),
    ).toEqual(null);
  });

  test('error: return non-root node', () => {
    const result = transformRichText([], createRichTextRootNode([]), (_path, node) =>
      ok(node.type === RichTextNodeType.root ? createRichTextParagraphNode([]) : node),
    );
    expectErrorResult(result, ErrorType.Generic, 'Rich text transformer didn’t return a root node');
  });
});
