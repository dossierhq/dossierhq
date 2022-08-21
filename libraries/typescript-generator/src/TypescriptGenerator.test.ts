import { AdminSchema, FieldType } from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
import { generateTypescriptForSchema } from './TypescriptGenerator.js';

describe('generateTypescriptForSchema', () => {
  test('empty', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({ entityTypes: [], valueTypes: [] }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('Foo (no fields)', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('Booleans', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({
          entityTypes: [
            {
              name: 'Booleans',
              adminOnly: false,
              fields: [
                { name: 'boolean', type: FieldType.Boolean },
                { name: 'booleanList', type: FieldType.Boolean, list: true },
              ],
            },
          ],
          valueTypes: [],
        }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('EntityTypes', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({
          entityTypes: [
            {
              name: 'EntityTypes',
              adminOnly: false,
              fields: [
                { name: 'entityType', type: FieldType.EntityType },
                { name: 'entityTypeList', type: FieldType.EntityType, list: true },
              ],
            },
          ],
          valueTypes: [],
        }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('Locations', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({
          entityTypes: [
            {
              name: 'Locations',
              adminOnly: false,
              fields: [
                { name: 'location', type: FieldType.Location },
                { name: 'locationList', type: FieldType.Location, list: true },
              ],
            },
          ],
          valueTypes: [],
        }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('RichTexts', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({
          entityTypes: [
            {
              name: 'RichTexts',
              adminOnly: false,
              fields: [
                { name: 'richText', type: FieldType.RichText },
                { name: 'richTextList', type: FieldType.RichText, list: true },
              ],
            },
          ],
          valueTypes: [],
        }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('Strings', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({
          entityTypes: [
            {
              name: 'Strings',
              adminOnly: false,
              fields: [
                { name: 'string', type: FieldType.String, isName: true, required: true },
                { name: 'stringList', type: FieldType.String, list: true, required: true },
              ],
            },
          ],
          valueTypes: [],
        }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });

  test('ValueTypes', () => {
    expect(
      generateTypescriptForSchema({
        adminSchema: new AdminSchema({
          entityTypes: [
            {
              name: 'ValueTypes',
              adminOnly: false,
              fields: [
                { name: 'valueType', type: FieldType.ValueType, required: true },
                {
                  name: 'valueTypeBar',
                  type: FieldType.ValueType,
                  valueTypes: ['Foo'],
                  required: true,
                },
                { name: 'valueTypeList', type: FieldType.ValueType, list: true, required: true },
                {
                  name: 'valueTypeListBar',
                  type: FieldType.ValueType,
                  valueTypes: ['Foo'],
                  list: true,
                  required: true,
                },
              ],
            },
          ],
          valueTypes: [
            {
              name: 'Foo',
              adminOnly: false,
              fields: [{ name: 'string', type: FieldType.String, required: true }],
            },
          ],
        }),
        publishedSchema: null,
      })
    ).toMatchSnapshot();
  });
});
