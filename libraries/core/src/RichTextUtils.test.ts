import { describe, expect, test } from 'vitest';
import {
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextTextAndLineBreakNodes,
  createRichTextTextNode,
  richTextTextNodeHasFormat,
} from './RichTextUtils.js';

describe('createRichTextEntityNode', () => {
  test('with full entity', () => {
    const entity = { id: '123', info: { name: 'Hello' }, fields: { field: 'hello' } };
    expect(createRichTextEntityNode(entity)).toMatchInlineSnapshot(`
      {
        "format": "",
        "reference": {
          "id": "123",
        },
        "type": "entity",
        "version": 1,
      }
    `);
  });
});

describe('createRichTextEntityLinkNode', () => {
  test('with full entity', () => {
    const entity = { id: '123', info: { name: 'Hello' }, fields: { field: 'hello' } };
    expect(createRichTextEntityLinkNode(entity, [createRichTextTextNode('Foo')]))
      .toMatchInlineSnapshot(`
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Foo",
            "type": "text",
            "version": 1,
          },
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "reference": {
          "id": "123",
        },
        "type": "entityLink",
        "version": 1,
      }
    `);
  });
});

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

describe('createRichTextTextAndLineBreakNodes', () => {
  test('format: bold, one line break', () => {
    expect(createRichTextTextAndLineBreakNodes('hello\nworld', { format: ['bold'] }))
      .toMatchInlineSnapshot(`
      [
        {
          "detail": 0,
          "format": 1,
          "mode": "normal",
          "style": "",
          "text": "hello",
          "type": "text",
          "version": 1,
        },
        {
          "type": "linebreak",
          "version": 1,
        },
        {
          "detail": 0,
          "format": 1,
          "mode": "normal",
          "style": "",
          "text": "world",
          "type": "text",
          "version": 1,
        },
      ]
    `);
  });

  test('format: italic, starting and ending line breaks', () => {
    expect(createRichTextTextAndLineBreakNodes('\nhello\n', { format: ['italic'] }))
      .toMatchInlineSnapshot(`
      [
        {
          "type": "linebreak",
          "version": 1,
        },
        {
          "detail": 0,
          "format": 2,
          "mode": "normal",
          "style": "",
          "text": "hello",
          "type": "text",
          "version": 1,
        },
        {
          "type": "linebreak",
          "version": 1,
        },
      ]
    `);
  });

  test('format: bold, one line break (rn)', () => {
    expect(createRichTextTextAndLineBreakNodes('hello\r\nworld', { format: ['bold'] }))
      .toMatchInlineSnapshot(`
      [
        {
          "detail": 0,
          "format": 1,
          "mode": "normal",
          "style": "",
          "text": "hello",
          "type": "text",
          "version": 1,
        },
        {
          "type": "linebreak",
          "version": 1,
        },
        {
          "detail": 0,
          "format": 1,
          "mode": "normal",
          "style": "",
          "text": "world",
          "type": "text",
          "version": 1,
        },
      ]
    `);
  });

  test('text with carriage return without line feed', () => {
    expect(createRichTextTextAndLineBreakNodes('hello\r')).toMatchInlineSnapshot(`
      [
        {
          "detail": 0,
          "format": 0,
          "mode": "normal",
          "style": "",
          "text": "hello",
          "type": "text",
          "version": 1,
        },
      ]
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
