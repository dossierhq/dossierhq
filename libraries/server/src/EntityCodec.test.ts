import {
  AdminSchemaWithMigrations,
  FieldType,
  createRichTextHeadingNode,
  createRichText,
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
        { name: 'valueItemList', type: FieldType.ValueItem, list: true },
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

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        valueItem: {
          type: 'ValueItem',
          string: '1',
          child: {
            type: 'ValueItem',
            string: '1.1',
            child: { type: 'ValueItem', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "richText": null,
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
        "valueItemList": null,
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

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextValueItemNode({
            type: 'ValueItem',
            string: '1',
            child: { type: 'ValueItem', string: '1.1', child: null },
          }),
        ]),
      },
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

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextValueItemNode({
            type: 'ValueItem',
            string: '1',
            child: { type: 'ValueItem', string: '1.1', child: null },
          }),
        ]),
      },
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

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        valueItem: {
          type: 'ValueItem',
          string: '1',
          child: {
            type: 'ValueItem',
            string: '1.1',
            child: { type: 'ValueItem', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "richText": null,
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
        "valueItemList": null,
      }
    `);
  });
});

describe('applySchemaMigrationsToFieldValues renameType', () => {
  test('nested value item', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', valueType: 'ValueItem', newName: 'ValueItem2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        valueItem: {
          type: 'ValueItem',
          string: '1',
          child: {
            type: 'ValueItem',
            string: '1.1',
            child: { type: 'ValueItem', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "richText": null,
        "valueItem": {
          "child": {
            "child": {
              "child": null,
              "string": "1.1.1",
              "type": "ValueItem2",
            },
            "string": "1.1",
            "type": "ValueItem2",
          },
          "string": "1",
          "type": "ValueItem2",
        },
        "valueItemList": null,
      }
    `);
  });

  test('value item list', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', valueType: 'ValueItem', newName: 'ValueItem2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        valueItemList: [{ type: 'ValueItem', string: '1', child: null }],
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "richText": null,
        "valueItem": null,
        "valueItemList": [
          {
            "child": null,
            "string": "1",
            "type": "ValueItem2",
          },
        ],
      }
    `);
  });

  test('value item in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', valueType: 'ValueItem', newName: 'ValueItem2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextValueItemNode({
            type: 'ValueItem',
            string: '1',
            child: { type: 'ValueItem', string: '1.1', child: null },
          }),
        ]),
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
    expect(((fieldValues.richText as RichText).root.children[1] as RichTextValueItemNode).data)
      .toMatchInlineSnapshot(`
      {
        "child": {
          "child": null,
          "string": "1.1",
          "type": "ValueItem2",
        },
        "string": "1",
        "type": "ValueItem2",
      }
    `);
  });
});

describe('applySchemaMigrationsToFieldValues deleteType', () => {
  test('nested value item', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'ValueItem' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        valueItem: {
          type: 'ValueItem',
          string: '1',
          child: {
            type: 'ValueItem',
            string: '1.1',
            child: { type: 'ValueItem', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
  });

  test('value item list', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'ValueItem' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        valueItemList: [{ type: 'ValueItem', string: '1', child: null }],
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
  });

  test('value item in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'ValueItem' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextValueItemNode({
            type: 'ValueItem',
            string: '1',
            child: { type: 'ValueItem', string: '1.1', child: null },
          }),
        ]),
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
  });
});

describe('applySchemaMigrationsToFieldValues combos', () => {
  test('rename type and field', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            { action: 'renameType', valueType: 'ValueItem', newName: 'ValueItem2' },
            { action: 'renameField', valueType: 'ValueItem2', field: 'string', newName: 'string2' },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', {
      schemaVersion: 1,
      fields: {
        valueItem: {
          type: 'ValueItem',
          string: '1',
          child: {
            type: 'ValueItem',
            string: '1.1',
            child: { type: 'ValueItem', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "richText": null,
        "valueItem": {
          "child": {
            "child": {
              "child": null,
              "string2": "1.1.1",
              "type": "ValueItem2",
            },
            "string2": "1.1",
            "type": "ValueItem2",
          },
          "string2": "1",
          "type": "ValueItem2",
        },
        "valueItemList": null,
      }
    `);
  });
});
