import { AdminSchema, FieldType } from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { generateTypescriptForSchema } from './TypescriptGenerator.js';

describe('generateTypescriptForSchema', () => {
  test('empty', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({}).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Foo (no fields)', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Booleans', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Booleans',
              fields: [
                { name: 'boolean', type: FieldType.Boolean },
                { name: 'booleanList', type: FieldType.Boolean, list: true },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('EntityTypes', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'EntityTypes',
              fields: [
                { name: 'entityType', type: FieldType.Entity },
                { name: 'entityTypeList', type: FieldType.Entity, list: true },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Locations', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Locations',
              fields: [
                { name: 'location', type: FieldType.Location },
                { name: 'locationList', type: FieldType.Location, list: true },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Numbers', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Numbers',
              fields: [
                { name: 'number', type: FieldType.Number },
                { name: 'numberInteger', type: FieldType.Number, integer: true },
                { name: 'numberList', type: FieldType.Number, list: true },
                { name: 'numberIntegerList', type: FieldType.Number, list: true, integer: true },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('RichTexts', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'RichTexts',
              fields: [
                { name: 'richText', type: FieldType.RichText },
                { name: 'richTextList', type: FieldType.RichText, list: true },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Strings', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Strings',
              fields: [
                { name: 'string', type: FieldType.String, required: true },
                { name: 'stringList', type: FieldType.String, list: true, required: true },
                {
                  name: 'values',
                  type: FieldType.String,
                  required: true,
                  values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
                },
                {
                  name: 'valuesList',
                  type: FieldType.String,
                  list: true,
                  required: true,
                  values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
                },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Components', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'ComponentTypes',
              fields: [
                { name: 'component', type: FieldType.Component, required: true },
                {
                  name: 'componentFoo',
                  type: FieldType.Component,
                  componentTypes: ['Foo'],
                  required: true,
                },
                {
                  name: 'componentFooBar',
                  type: FieldType.Component,
                  componentTypes: ['Foo', 'Bar'],
                  required: true,
                },
                { name: 'componentList', type: FieldType.Component, list: true, required: true },
                {
                  name: 'componentListFoo',
                  type: FieldType.Component,
                  componentTypes: ['Foo'],
                  list: true,
                  required: true,
                },
                {
                  name: 'componentListFooBar',
                  type: FieldType.Component,
                  componentTypes: ['Foo', 'Bar'],
                  list: true,
                  required: true,
                },
              ],
            },
          ],
          componentTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'string', type: FieldType.String, required: true }],
            },
            {
              name: 'Bar',
              fields: [{ name: 'string', type: FieldType.String, required: true }],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Component (no fields)', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Components',
              fields: [{ name: 'component', type: FieldType.Component, required: true }],
            },
          ],
          componentTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });

  test('Auth key pattern', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Abc',
              authKeyPattern: 'abc',
              fields: [],
            },
          ],
          patterns: [{ name: 'abc', pattern: '^[abc]$' }],
        }).valueOrThrow(),
        publishedSchema: null,
        authKeyPatternTypeMap: { abc: "'a'|'b'|'c'" },
      }),
    ).toMatchSnapshot();
  });

  test('Unique index', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Strings',
              fields: [{ name: 'string', type: FieldType.String, index: 'slug' }],
            },
          ],
          indexes: [{ name: 'slug', type: 'unique' }],
        }).valueOrThrow(),
        publishedSchema: null,
      }),
    ).toMatchSnapshot();
  });
});

describe('generateTypescriptForSchema published', () => {
  test('empty', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: null,
        publishedSchema: AdminSchema.createAndValidate({}).valueOrThrow().toPublishedSchema(),
      }),
    ).toMatchSnapshot();
  });

  test('adminOnly entity type', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: null,
        publishedSchema: AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', adminOnly: true, fields: [] }],
        })
          .valueOrThrow()
          .toPublishedSchema(),
      }),
    ).toMatchSnapshot();
  });

  test('adminOnly field', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: null,
        publishedSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'field', adminOnly: true, type: FieldType.String }],
            },
          ],
        })
          .valueOrThrow()
          .toPublishedSchema(),
      }),
    ).toMatchSnapshot();
  });

  test('required fields', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: null,
        publishedSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [
                { name: 'string', type: FieldType.String, required: true },
                { name: 'stringList', type: FieldType.String, list: true, required: true },
              ],
            },
          ],
        })
          .valueOrThrow()
          .toPublishedSchema(),
      }),
    ).toMatchSnapshot();
  });

  test('Auth key pattern', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: null,
        publishedSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Abc',
              authKeyPattern: 'abc',
              fields: [],
            },
          ],
          patterns: [{ name: 'abc', pattern: '^[abc]$' }],
        })
          .valueOrThrow()
          .toPublishedSchema(),
        authKeyPatternTypeMap: { abc: "'a'|'b'|'c'" },
      }),
    ).toMatchSnapshot();
  });

  test('Unique index', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: null,
        publishedSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Strings',
              fields: [{ name: 'string', type: FieldType.String, index: 'slug' }],
            },
          ],
          indexes: [{ name: 'slug', type: 'unique' }],
        })
          .valueOrThrow()
          .toPublishedSchema(),
      }),
    ).toMatchSnapshot();
  });
});
