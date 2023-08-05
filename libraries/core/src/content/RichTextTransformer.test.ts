import { describe, expect, test } from 'vitest';
import { ErrorType, ok } from '../ErrorResult.js';
import { RichTextNodeType } from '../Types.js';
import { expectErrorResult } from '../test/CoreTestUtils.js';
import { transformRichText } from './RichTextTransformer.js';
import {
  createRichText,
  createRichTextParagraphNode,
  createRichTextTextNode,
} from './RichTextUtils.js';

describe('transformRichText', () => {
  test('return null root', () => {
    expect(
      transformRichText(
        [],
        createRichText([createRichTextParagraphNode([createRichTextTextNode('hello')])]),
        (_path, _node) => ok(null),
      ).valueOrThrow(),
    ).toEqual(null);
  });

  test('return empty document', () => {
    expect(
      transformRichText(
        [],
        createRichText([createRichTextParagraphNode([createRichTextTextNode('hello')])]),
        (_path, node) => ok(node.type === RichTextNodeType.text ? null : node),
      ).valueOrThrow(),
    ).toEqual(null);
  });

  test('error: return non-root node', () => {
    const result = transformRichText([], createRichText([]), (_path, node) =>
      ok(node.type === RichTextNodeType.root ? createRichTextParagraphNode([]) : node),
    );
    expectErrorResult(result, ErrorType.Generic, 'Rich text transformer didn’t return a root node');
  });
});
