import { describe, expect, test } from 'vitest';
import { createRichTextTextNode, richTextTextNodeHasFormat } from './RichTextUtils.js';

describe('createRichTextTextNode', () => {
  test('format: bold', () => {
    expect(createRichTextTextNode('hello', { format: ['bold'] })).toMatchInlineSnapshot(`
      {
        "detail": 0,
        "format": 1,
        "mode": "normal",
        "style": "",
        "text": "hello",
        "type": "text",
        "version": 1,
      }
    `);
  });
});

describe('richTextTextNodeHasFormat', () => {
  test('format: bold is bold', () => {
    expect(
      richTextTextNodeHasFormat(createRichTextTextNode('hello', { format: ['bold'] }), 'bold')
    ).toBe(true);
  });

  test('format: italic is not bold', () => {
    expect(
      richTextTextNodeHasFormat(createRichTextTextNode('hello', { format: ['italic'] }), 'bold')
    ).toBe(false);
  });
});
