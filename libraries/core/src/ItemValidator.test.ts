import { describe, expect, test } from 'vitest';
import { ItemTraverseNodeErrorType, traverseEntity } from './ItemTraverser.js';
import { copyEntity, normalizeEntityFields } from './ItemUtils.js';
import type { PublishValidationIssue, SaveValidationIssue } from './ItemValidator.js';
import {
  groupValidationIssuesByTopLevelPath,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
} from './ItemValidator.js';
import {
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
} from './RichTextUtils.js';
import { AdminSchema, FieldType } from './Schema.js';
import type { AdminEntityCreate, EntityLike } from './Types.js';

const adminSchema = AdminSchema.createAndValidate({
  entityTypes: [
    {
      name: 'RichTextsEntity',
      fields: [{ name: 'anyNodes', type: FieldType.RichText }],
    },
    {
      name: 'StringsEntity',
      fields: [
        { name: 'required', type: FieldType.String, required: true },
        { name: 'pattern', type: FieldType.String, matchPattern: 'foo-bar-baz' },
        { name: 'patternList', type: FieldType.String, list: true, matchPattern: 'foo-bar-baz' },
      ],
    },
    {
      name: 'ValueItemsEntity',
      fields: [{ name: 'any', type: FieldType.ValueItem }],
    },
  ],
  valueTypes: [{ name: 'AdminOnlyValueItem', adminOnly: true, fields: [] }],
  patterns: [{ name: 'foo-bar-baz', pattern: '^(foo|bar|baz)$' }],
}).valueOrThrow();

const STRINGS_ENTITY_DEFAULT: AdminEntityCreate = {
  info: { type: 'StringsEntity', name: 'StringsEntity', authKey: 'none' },
  fields: { required: '-' },
};

const RICH_TEXTS_ENTITY_DEFAULT: AdminEntityCreate = {
  info: { type: 'RichTextsEntity', name: 'RichTextsEntity', authKey: 'none' },
  fields: {},
};

const VALUE_ITEMS_ENTITY_DEFAULT: AdminEntityCreate = {
  info: { type: 'ValueItemsEntity', name: 'ValueItemsEntity', authKey: 'none' },
  fields: {},
};

function validateEntity(entity: EntityLike) {
  const normalizedEntity = {
    ...entity,
    fields: normalizeEntityFields(adminSchema, entity).valueOrThrow(),
  };

  const errors: (SaveValidationIssue | PublishValidationIssue)[] = [];
  for (const node of traverseEntity(adminSchema, ['entity'], normalizedEntity)) {
    const error = validateTraverseNodeForSave(adminSchema, node);
    if (error) {
      errors.push(error);
    }
  }

  for (const node of traverseEntity(
    adminSchema.toPublishedSchema(),
    ['entity'],
    normalizedEntity
  )) {
    const error = validateTraverseNodeForPublish(adminSchema, node);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

describe('validateTraverseNodeForSave', () => {
  test('error', () => {
    expect(
      validateTraverseNodeForSave(adminSchema, {
        type: 'error',
        path: ['entity', 'foo'],
        errorType: ItemTraverseNodeErrorType.generic,
        message: 'Error message',
      })
    ).toMatchSnapshot();
  });
});

describe('Validate entity', () => {
  test('Pass: matchPattern matched string', () => {
    expect(
      validateEntity(copyEntity(STRINGS_ENTITY_DEFAULT, { fields: { pattern: 'baz' } }))
    ).toEqual([]);
  });

  test('Fail: matchPattern unmatched string', () => {
    expect(
      validateEntity(copyEntity(STRINGS_ENTITY_DEFAULT, { fields: { pattern: 'will not match' } }))
    ).toMatchSnapshot();
  });

  test('Fail: required with no value', () => {
    expect(
      validateEntity(copyEntity(STRINGS_ENTITY_DEFAULT, { fields: { required: null } }))
    ).toMatchSnapshot();
  });

  test('Pass: matchPattern matched string items in list', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_DEFAULT, { fields: { patternList: ['foo', 'bar', 'baz'] } })
      )
    ).toEqual([]);
  });

  test('Fail: matchPattern unmatched string item in list', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_DEFAULT, { fields: { patternList: ['foo', 'will not match'] } })
      )
    ).toMatchSnapshot();
  });

  test('Fail: rich text text node with line break', () => {
    expect(
      validateEntity(
        copyEntity(RICH_TEXTS_ENTITY_DEFAULT, {
          fields: {
            anyNodes: createRichTextRootNode([
              createRichTextParagraphNode([createRichTextTextNode('hello\nworld')]),
            ]),
          },
        })
      )
    ).toMatchSnapshot();
  });

  test('Fail: admin only value item in normal field', () => {
    expect(
      validateEntity(
        copyEntity(VALUE_ITEMS_ENTITY_DEFAULT, {
          fields: {
            any: { type: 'AdminOnlyValueItem' },
          },
        })
      )
    ).toMatchSnapshot();
  });
});

describe('groupValidationIssuesByTopLevelPath', () => {
  test('no errors', () => {
    expect(groupValidationIssuesByTopLevelPath([])).toEqual({ root: [], children: new Map() });
  });

  test('root errors and list errors', () => {
    expect(
      groupValidationIssuesByTopLevelPath([
        { type: 'save', path: [], message: 'Root error' },
        { type: 'save', path: [0], message: 'Index 0 error' },
      ])
    ).toEqual({
      root: [{ type: 'save', path: [], message: 'Root error' }],
      children: new Map([[0, [{ type: 'save', path: [], message: 'Index 0 error' }]]]),
    });
  });

  test('root errors and field errors', () => {
    expect(
      groupValidationIssuesByTopLevelPath([
        { type: 'save', path: [], message: 'Root error' },
        { type: 'save', path: ['field'], message: 'Field error' },
      ])
    ).toEqual({
      root: [{ type: 'save', path: [], message: 'Root error' }],
      children: new Map([['field', [{ type: 'save', path: [], message: 'Field error' }]]]),
    });
  });
});
