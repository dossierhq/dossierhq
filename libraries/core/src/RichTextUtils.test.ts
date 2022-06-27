import { describe, expect, test } from 'vitest';
import { createRichTextTextNode } from './RichTextUtils.js';

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
