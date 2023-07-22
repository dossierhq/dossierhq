import {
  AdminSchemaWithMigrations,
  FieldType,
  createRichTextHeadingNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
  type RichText,
  type RichTextValueItemNode,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { forTest } from './EntityCodec.js';

const { applySchemaMigrationsToFieldValues } = forTest;

const ADMIN_SCHEMA_BASE = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [
    {
      name: 'Entity',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'valueItem', type: FieldType.ValueItem },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'ValueItem',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'child', type: FieldType.ValueItem },
      ],
    },
  ],
}).valueOrThrow();

describe('applySchemaMigrationsToFieldValues renameField', () => {
  test('nested value item', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            {
              action: 'renameField',
              valueType: 'ValueItem',
              field: 'string',
              newName: 'string2',
            },
            {
              action: 'renameField',
              valueType: 'ValueItem',
              field: 'child',
              newName: 'child2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', 1, {
      valueItem: {
        type: 'ValueItem',
        string: '1',
        child: {
          type: 'ValueItem',
          string: '1.1',
          child: { type: 'ValueItem', string: '1.1.1', child: null },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "valueItem": {
          "child2": {
            "child2": {
              "child2": null,
              "string2": "1.1.1",
              "type": "ValueItem",
            },
            "string2": "1.1",
            "type": "ValueItem",
          },
          "string2": "1",
          "type": "ValueItem",
        },
      }
    `);
  });

  test('value item in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            {
              action: 'renameField',
              valueType: 'ValueItem',
              field: 'string',
              newName: 'string2',
            },
            {
              action: 'renameField',
              valueType: 'ValueItem',
              field: 'child',
              newName: 'child2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', 1, {
      richText: createRichTextRootNode([
        createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
        createRichTextValueItemNode({
          type: 'ValueItem',
          string: '1',
          child: { type: 'ValueItem', string: '1.1', child: null },
        }),
      ]),
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
    expect(((fieldValues.richText as RichText).root.children[1] as RichTextValueItemNode).data)
      .toMatchInlineSnapshot(`
      {
        "child2": {
          "child2": null,
          "string2": "1.1",
          "type": "ValueItem",
        },
        "string2": "1",
        "type": "ValueItem",
      }
    `);
  });
});

describe('applySchemaMigrationsToFieldValues deleteField', () => {
  test('nested value item', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'deleteField', valueType: 'ValueItem', field: 'string' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', 1, {
      richText: createRichTextRootNode([
        createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
        createRichTextValueItemNode({
          type: 'ValueItem',
          string: '1',
          child: { type: 'ValueItem', string: '1.1', child: null },
        }),
      ]),
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
    expect(((fieldValues.richText as RichText).root.children[1] as RichTextValueItemNode).data)
      .toMatchInlineSnapshot(`
        {
          "child": {
            "child": null,
            "type": "ValueItem",
          },
          "type": "ValueItem",
        }
      `);
  });

  test('value item in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'deleteField', valueType: 'ValueItem', field: 'string' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', 1, {
      valueItem: {
        type: 'ValueItem',
        string: '1',
        child: {
          type: 'ValueItem',
          string: '1.1',
          child: { type: 'ValueItem', string: '1.1.1', child: null },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "valueItem": {
          "child": {
            "child": {
              "child": null,
              "type": "ValueItem",
            },
            "type": "ValueItem",
          },
          "type": "ValueItem",
        },
      }
    `);
  });
});
