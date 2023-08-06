import { describe, expect, test } from 'vitest';
import type { AdminEntity, AdminEntityCreate, EntityLike } from '../Types.js';
import { AdminSchema } from '../schema/AdminSchema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { normalizeEntityFields } from './ContentNormalizer.js';
import { ContentTraverseNodeErrorType, traverseEntity } from './ContentTraverser.js';
import { copyEntity } from './ContentUtils.js';
import {
  groupValidationIssuesByTopLevelPath,
  validateEntityInfo,
  validateEntityInfoForCreate,
  validateEntityInfoForUpdate,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from './ContentValidator.js';
import {
  createRichText,
  createRichTextParagraphNode,
  createRichTextTextNode,
} from './RichTextUtils.js';

const adminSchema = AdminSchema.createAndValidate({
  entityTypes: [
    {
      name: 'NumbersEntity',
      fields: [{ name: 'integer', type: FieldType.Number, integer: true }],
    },
    {
      name: 'RichTextsEntity',
      fields: [{ name: 'anyNodes', type: FieldType.RichText }],
    },
    {
      name: 'StringsEntity',
      authKeyPattern: 'noneSubject',
      fields: [
        { name: 'normal', type: FieldType.String },
        { name: 'required', type: FieldType.String, required: true },
        { name: 'requiredAndAdminOnly', type: FieldType.String, adminOnly: true, required: true },
        { name: 'multiline', type: FieldType.String, multiline: true },
        { name: 'pattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        { name: 'patternList', type: FieldType.String, list: true, matchPattern: 'fooBarBaz' },
        {
          name: 'values',
          type: FieldType.String,
          values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
        },
        {
          name: 'valuesList',
          type: FieldType.String,
          list: true,
          values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
        },
      ],
    },
    {
      name: 'ValueItemsEntity',
      fields: [{ name: 'any', type: FieldType.ValueItem }],
    },
  ],
  valueTypes: [{ name: 'AdminOnlyValueItem', adminOnly: true, fields: [] }],
  patterns: [
    { name: 'fooBarBaz', pattern: '^(foo|bar|baz)$' },
    { name: 'noneSubject', pattern: '^(none|subject)$' },
  ],
}).valueOrThrow();

const NUMBERS_ENTITY_CREATE_DEFAULT: AdminEntityCreate = {
  info: { type: 'NumbersEntity', name: 'NumbersEntity', authKey: 'none' },
  fields: {},
};

const STRINGS_ENTITY_CREATE_DEFAULT: AdminEntityCreate = {
  info: { type: 'StringsEntity', name: 'StringsEntity', authKey: 'none' },
  fields: { required: '-' },
};

const STRINGS_ENTITY_DEFAULT: AdminEntity = {
  id: '123',
  info: {
    type: 'StringsEntity',
    name: 'StringsEntity',
    authKey: 'none',
    version: 0,
    status: 'draft',
    valid: true,
    validPublished: null,
    createdAt: new Date('2023-04-04T19:26:16.546Z'),
    updatedAt: new Date('2023-04-04T19:26:16.546Z'),
  },
  fields: {},
};

const RICH_TEXTS_ENTITY_CREATE_DEFAULT: AdminEntityCreate = {
  info: { type: 'RichTextsEntity', name: 'RichTextsEntity', authKey: 'none' },
  fields: {},
};

const VALUE_ITEMS_ENTITY_CREATE_DEFAULT: AdminEntityCreate = {
  info: { type: 'ValueItemsEntity', name: 'ValueItemsEntity', authKey: 'none' },
  fields: {},
};

function validateEntity(entity: EntityLike) {
  const normalizedEntity = {
    ...entity,
    fields: normalizeEntityFields(adminSchema, ['entity'], entity).valueOrThrow(),
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
    normalizedEntity,
  )) {
    const error = validateTraverseNodeForPublish(adminSchema, node);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

describe('validateEntityInfo', () => {
  test('no type', () => {
    expect(
      validateEntityInfo(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_DEFAULT, { info: { type: '' } }),
      ),
    ).toMatchSnapshot();
  });

  test('invalid type', () => {
    expect(
      validateEntityInfo(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_DEFAULT, { info: { type: 'InvalidType' } }),
      ),
    ).toMatchSnapshot();
  });

  test('no authKey', () => {
    expect(
      validateEntityInfo(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_DEFAULT, { info: { authKey: '' } }),
      ),
    ).toMatchSnapshot();
  });

  test('authKey not matching pattern', () => {
    expect(
      validateEntityInfo(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_DEFAULT, { info: { authKey: 'something else' } }),
      ),
    ).toMatchSnapshot();
  });

  test('no name', () => {
    expect(
      validateEntityInfo(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_DEFAULT, { info: { name: '' } }),
      ),
    ).toMatchSnapshot();
  });

  test('name with line break', () => {
    expect(
      validateEntityInfo(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_DEFAULT, { info: { name: 'Hello\nworld' } }),
      ),
    ).toMatchSnapshot();
  });
});

describe('validateEntityInfoForCreate', () => {
  test('no type', () => {
    expect(
      validateEntityInfoForCreate(adminSchema, ['entity'], {
        info: { type: '', name: 'No type', authKey: 'none' },
        fields: {},
      }),
    ).toMatchSnapshot();
  });

  test('invalid type', () => {
    expect(
      validateEntityInfoForCreate(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { info: { type: 'InvalidType' } }),
      ),
    ).toMatchSnapshot();
  });

  test('no authKey', () => {
    expect(
      validateEntityInfoForCreate(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { info: { authKey: '' } }),
      ),
    ).toMatchSnapshot();
  });

  test('authKey not matching pattern', () => {
    expect(
      validateEntityInfoForCreate(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { info: { authKey: 'something else' } }),
      ),
    ).toMatchSnapshot();
  });

  test('no name', () => {
    expect(
      validateEntityInfoForCreate(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { info: { name: '' } }),
      ),
    ).toMatchSnapshot();
  });

  test('name with line break', () => {
    expect(
      validateEntityInfoForCreate(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { info: { name: 'Hello\nworld' } }),
      ),
    ).toMatchSnapshot();
  });

  test('invalid version', () => {
    expect(
      validateEntityInfoForCreate(
        adminSchema,
        ['entity'],
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { info: { version: 1 as 0 } }),
      ),
    ).toMatchSnapshot();
  });
});

describe('validateEntityInfoForUpdate', () => {
  test('change type', () => {
    expect(
      validateEntityInfoForUpdate(
        ['entity'],
        { info: { type: 'StringEntity', authKey: 'none', version: 1 } },
        { id: '123', info: { type: 'RichTextsEntity' }, fields: {} },
      ),
    ).toMatchSnapshot();
  });

  test('valid: same type', () => {
    expect(
      validateEntityInfoForUpdate(
        ['entity'],
        { info: { type: 'StringEntity', authKey: 'none', version: 1 } },
        { id: '123', info: { type: 'StringEntity' }, fields: {} },
      ),
    ).toBeNull();
  });

  test('change authKey', () => {
    expect(
      validateEntityInfoForUpdate(
        ['entity'],
        { info: { type: 'StringEntity', authKey: 'none', version: 1 } },
        { id: '123', info: { authKey: 'subject' }, fields: {} },
      ),
    ).toMatchSnapshot();
  });

  test('valid: same authKey', () => {
    expect(
      validateEntityInfoForUpdate(
        ['entity'],
        { info: { type: 'StringEntity', authKey: 'none', version: 1 } },
        { id: '123', info: { authKey: 'none' }, fields: {} },
      ),
    ).toBeNull();
  });

  test('name with line break', () => {
    expect(
      validateEntityInfoForUpdate(
        ['entity'],
        { info: { type: 'StringEntity', authKey: 'none', version: 1 } },
        { id: '123', info: { name: 'hello\nworld' }, fields: {} },
      ),
    ).toMatchSnapshot();
  });

  test('version with wrong value', () => {
    expect(
      validateEntityInfoForUpdate(
        ['entity'],
        { info: { type: 'StringEntity', authKey: 'none', version: 1 } },
        { id: '123', info: { version: 1 }, fields: {} },
      ),
    ).toMatchSnapshot();
  });

  test('valid: version with correct value', () => {
    expect(
      validateEntityInfoForUpdate(
        ['entity'],
        { info: { type: 'StringEntity', authKey: 'none', version: 1 } },
        { id: '123', info: { version: 2 }, fields: {} },
      ),
    ).toBeNull();
  });
});

describe('validateTraverseNodeForSave', () => {
  test('error', () => {
    expect(
      validateTraverseNodeForSave(adminSchema, {
        type: 'error',
        path: ['entity', 'foo'],
        errorType: ContentTraverseNodeErrorType.generic,
        message: 'Error message',
      }),
    ).toMatchSnapshot();
  });
});

describe('Validate entity shared', () => {
  test('Pass: required and adminOnly with no value', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { fields: { requiredAndAdminOnly: null } }),
      ),
    ).toEqual([]);
  });

  test('Fail: required with no value', () => {
    expect(
      validateEntity(copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { fields: { required: null } })),
    ).toMatchSnapshot();
  });
});

describe('Validate entity number', () => {
  test('Fail: integer with float value', () => {
    expect(
      validateEntity(copyEntity(NUMBERS_ENTITY_CREATE_DEFAULT, { fields: { integer: 1.2345 } })),
    ).toMatchSnapshot();
  });
});

describe('Validate entity richText', () => {
  test('Fail: rich text text node with line break', () => {
    expect(
      validateEntity(
        copyEntity(RICH_TEXTS_ENTITY_CREATE_DEFAULT, {
          fields: {
            anyNodes: createRichText([
              createRichTextParagraphNode([createRichTextTextNode('hello\nworld')]),
            ]),
          },
        }),
      ),
    ).toMatchSnapshot();
  });
});

describe('Validate entity string', () => {
  test('Pass: matchPattern matched string', () => {
    expect(
      validateEntity(copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { fields: { pattern: 'baz' } })),
    ).toEqual([]);
  });

  test('Fail: matchPattern unmatched string', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { fields: { pattern: 'will not match' } }),
      ),
    ).toMatchSnapshot();
  });

  test('Pass: matchPattern matched string items in list', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, {
          fields: { patternList: ['foo', 'bar', 'baz'] },
        }),
      ),
    ).toEqual([]);
  });

  test('Fail: matchPattern unmatched string item in list', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, {
          fields: { patternList: ['foo', 'will not match'] },
        }),
      ),
    ).toMatchSnapshot();
  });

  test('Pass: multiline string', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, {
          fields: { multiline: 'foo\nbar\nbaz' },
        }),
      ),
    ).toEqual([]);
  });

  test('Fail: multiline=false string with line break', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, {
          fields: { normal: 'foo\nbar\nbaz' },
        }),
      ),
    ).toMatchSnapshot();
  });

  test('Pass: values matched string', () => {
    expect(
      validateEntity(copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { fields: { values: 'baz' } })),
    ).toEqual([]);
  });

  test('Pass: values matched string list', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, {
          fields: { valuesList: ['foo', 'bar', 'baz'] },
        }),
      ),
    ).toEqual([]);
  });

  test('Fail: values unmatched string', () => {
    expect(
      validateEntity(copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { fields: { values: 'other' } })),
    ).toMatchSnapshot();
  });

  test('Fail: values unmatched string list', () => {
    expect(
      validateEntity(
        copyEntity(STRINGS_ENTITY_CREATE_DEFAULT, { fields: { valuesList: ['foo', 'other'] } }),
      ),
    ).toMatchSnapshot();
  });
});

describe('Validate entity valueItem', () => {
  test('Fail: admin only value item in normal field', () => {
    expect(
      validateEntity(
        copyEntity(VALUE_ITEMS_ENTITY_CREATE_DEFAULT, {
          fields: {
            any: { type: 'AdminOnlyValueItem' },
          },
        }),
      ),
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
      ]),
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
      ]),
    ).toEqual({
      root: [{ type: 'save', path: [], message: 'Root error' }],
      children: new Map([['field', [{ type: 'save', path: [], message: 'Field error' }]]]),
    });
  });
});
