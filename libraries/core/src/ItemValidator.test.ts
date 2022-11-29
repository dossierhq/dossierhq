import { describe, expect, test } from 'vitest';
import { ItemTraverseNodeErrorType, traverseEntity } from './ItemTraverser.js';
import type { ValidationError, ValidationOptions } from './ItemValidator.js';
import { validateTraverseNode } from './ItemValidator.js';
import {
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
} from './RichTextUtils.js';
import { AdminSchema, FieldType } from './Schema.js';
import type { EntityLike } from './Types.js';

const schema = AdminSchema.createAndValidate({
  entityTypes: [
    {
      name: 'RichTextsEntity',
      fields: [{ name: 'anyNodes', type: FieldType.RichText }],
    },
    {
      name: 'StringsEntity',
      fields: [
        { name: 'pattern', type: FieldType.String, matchPattern: 'foo-bar-baz' },
        { name: 'patternList', type: FieldType.String, list: true, matchPattern: 'foo-bar-baz' },
      ],
    },
  ],
  patterns: [{ name: 'foo-bar-baz', pattern: '^(foo|bar|baz)$' }],
}).valueOrThrow();

function validateEntity(entity: EntityLike, options: ValidationOptions) {
  const errors: ValidationError[] = [];
  for (const node of traverseEntity(schema, ['entity'], entity)) {
    const error = validateTraverseNode(schema, node, options);
    if (error) {
      errors.push(error);
    }
  }
  return errors;
}

describe('validateTraverseNode', () => {
  test('error', () => {
    expect(
      validateTraverseNode(
        schema,
        {
          type: 'error',
          path: ['entity', 'foo'],
          errorType: ItemTraverseNodeErrorType.generic,
          message: 'Error message',
        },
        { validatePublish: true }
      )
    ).toMatchInlineSnapshot(`
      {
        "message": "Error message",
        "path": [
          "entity",
          "foo",
        ],
        "type": "save",
      }
    `);
  });

  test('Pass: matchPattern matched string', () => {
    expect(
      validateEntity(
        { info: { type: 'StringsEntity' }, fields: { pattern: 'baz' } },
        { validatePublish: false }
      )
    ).toEqual([]);
  });

  test('Fail: matchPattern unmatched string', () => {
    expect(
      validateEntity(
        { info: { type: 'StringsEntity' }, fields: { pattern: 'will not match' } },
        { validatePublish: false }
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "message": "Value does not match pattern foo-bar-baz",
          "path": [
            "entity",
            "fields",
            "pattern",
          ],
          "type": "save",
        },
      ]
    `);
  });

  test('Pass: matchPattern matched string items in list', () => {
    expect(
      validateEntity(
        {
          info: { type: 'StringsEntity' },
          fields: { patternList: ['foo', 'bar', 'baz'] },
        },
        { validatePublish: false }
      )
    ).toEqual([]);
  });

  test('Fail: matchPattern unmatched string item in list', () => {
    expect(
      validateEntity(
        {
          info: { type: 'StringsEntity' },
          fields: { patternList: ['foo', 'will not match'] },
        },
        { validatePublish: false }
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "message": "Value does not match pattern foo-bar-baz",
          "path": [
            "entity",
            "fields",
            "patternList",
            1,
          ],
          "type": "save",
        },
      ]
    `);
  });

  test('Fail: rich text text node with line break', () => {
    expect(
      validateEntity(
        {
          info: { type: 'RichTextsEntity' },
          fields: {
            anyNodes: createRichTextRootNode([
              createRichTextParagraphNode([createRichTextTextNode('hello\nworld')]),
            ]),
          },
        },
        { validatePublish: false }
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "message": "Rich text text nodes cannot contain line breaks, use linebreak nodes instead",
          "path": [
            "entity",
            "fields",
            "anyNodes",
            0,
            0,
          ],
          "type": "save",
        },
      ]
    `);
  });
});
