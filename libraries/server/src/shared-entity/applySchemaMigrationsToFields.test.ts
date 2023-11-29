import {
  AdminSchemaWithMigrations,
  FieldType,
  createRichText,
  createRichTextHeadingNode,
  createRichTextTextNode,
  createRichTextComponentNode,
  type RichText,
  type RichTextComponentNode,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { applySchemaMigrationsToFields } from './applySchemaMigrationsToFields.js';
import { ENCODE_VERSION_AS_IS } from './migrateDecodeAndNormalizeEntityFields.js';

const ADMIN_SCHEMA_BASE = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [
    {
      name: 'Entity',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'valueItem', type: FieldType.Component },
        { name: 'valueItemList', type: FieldType.Component, list: true },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'ValueItem',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'child', type: FieldType.Component },
      ],
    },
  ],
}).valueOrThrow();

describe('applySchemaMigrationsToFields renameField', () => {
  test('nested component', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            {
              action: 'renameField',
              componentType: 'ValueItem',
              field: 'string',
              newName: 'string2',
            },
            {
              action: 'renameField',
              componentType: 'ValueItem',
              field: 'child',
              newName: 'child2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
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

  test('component in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            {
              action: 'renameField',
              componentType: 'ValueItem',
              field: 'string',
              newName: 'string2',
            },
            {
              action: 'renameField',
              componentType: 'ValueItem',
              field: 'child',
              newName: 'child2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
            type: 'ValueItem',
            string: '1',
            child: { type: 'ValueItem', string: '1.1', child: null },
          }),
        ]),
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
    expect(((fieldValues.richText as RichText).root.children[1] as RichTextComponentNode).data)
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

describe('applySchemaMigrationsToFields deleteField', () => {
  test('nested component', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'deleteField', componentType: 'ValueItem', field: 'string' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
            type: 'ValueItem',
            string: '1',
            child: { type: 'ValueItem', string: '1.1', child: null },
          }),
        ]),
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
    expect(((fieldValues.richText as RichText).root.children[1] as RichTextComponentNode).data)
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

  test('component in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'deleteField', componentType: 'ValueItem', field: 'string' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
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

describe('applySchemaMigrationsToFields renameType', () => {
  test('nested component', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', componentType: 'ValueItem', newName: 'ValueItem2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
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

  test('component list', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', componentType: 'ValueItem', newName: 'ValueItem2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
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

  test('component in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', componentType: 'ValueItem', newName: 'ValueItem2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
            type: 'ValueItem',
            string: '1',
            child: { type: 'ValueItem', string: '1.1', child: null },
          }),
        ]),
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
    expect(((fieldValues.richText as RichText).root.children[1] as RichTextComponentNode).data)
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

describe('applySchemaMigrationsToFields deleteType', () => {
  test('nested component', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'ValueItem' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
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

  test('component list', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'ValueItem' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        valueItemList: [{ type: 'ValueItem', string: '1', child: null }],
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
  });

  test('component in rich text', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'ValueItem' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
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

describe('applySchemaMigrationsToFields combos', () => {
  test('rename type and field', () => {
    const adminSchema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            { action: 'renameType', componentType: 'ValueItem', newName: 'ValueItem2' },
            {
              action: 'renameField',
              componentType: 'ValueItem2',
              field: 'string',
              newName: 'string2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(adminSchema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
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
