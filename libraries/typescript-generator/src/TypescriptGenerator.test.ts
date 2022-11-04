import { AdminSchema, FieldType } from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
import { generateTypescriptForSchema } from './TypescriptGenerator.js';

describe('generateTypescriptForSchema', () => {
  test('empty', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({}).valueOrThrow(),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('Foo (no fields)', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
        publishedSchema: null,
      })
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
      })
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
                { name: 'entityType', type: FieldType.EntityType },
                { name: 'entityTypeList', type: FieldType.EntityType, list: true },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      })
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
      })
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
      })
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
                { name: 'string', type: FieldType.String, isName: true, required: true },
                { name: 'stringList', type: FieldType.String, list: true, required: true },
              ],
            },
          ],
        }).valueOrThrow(),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('ValueTypes', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'ValueTypes',
              fields: [
                { name: 'valueType', type: FieldType.ValueType, required: true },
                {
                  name: 'valueTypeFoo',
                  type: FieldType.ValueType,
                  valueTypes: ['Foo'],
                  required: true,
                },
                {
                  name: 'valueTypeFooBar',
                  type: FieldType.ValueType,
                  valueTypes: ['Foo', 'Bar'],
                  required: true,
                },
                { name: 'valueTypeList', type: FieldType.ValueType, list: true, required: true },
                {
                  name: 'valueTypeListFoo',
                  type: FieldType.ValueType,
                  valueTypes: ['Foo'],
                  list: true,
                  required: true,
                },
                {
                  name: 'valueTypeListFooBar',
                  type: FieldType.ValueType,
                  valueTypes: ['Foo', 'Bar'],
                  list: true,
                  required: true,
                },
              ],
            },
          ],
          valueTypes: [
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
      })
    ).toMatchSnapshot();
  });

  test('ValueTypes (no fields)', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'ValueType',
              fields: [{ name: 'valueType', type: FieldType.ValueType, required: true }],
            },
          ],
          valueTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });
});

describe('generateTypescriptForSchema published', () => {
  test('empty', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: null,
        publishedSchema: AdminSchema.createAndValidate({}).valueOrThrow().toPublishedSchema(),
      })
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
      })
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
      })
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
      })
    ).toMatchSnapshot();
  });
});
