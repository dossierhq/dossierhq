import {
  SchemaWithMigrations,
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

const ADMIN_SCHEMA_BASE = SchemaWithMigrations.createAndValidate({
  entityTypes: [
    {
      name: 'Entity',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'component', type: FieldType.Component },
        { name: 'componentList', type: FieldType.Component, list: true },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'Component',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'child', type: FieldType.Component },
      ],
    },
  ],
}).valueOrThrow();

describe('applySchemaMigrationsToFields renameField', () => {
  test('nested component', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            {
              action: 'renameField',
              componentType: 'Component',
              field: 'string',
              newName: 'string2',
            },
            {
              action: 'renameField',
              componentType: 'Component',
              field: 'child',
              newName: 'child2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        component: {
          type: 'Component',
          string: '1',
          child: {
            type: 'Component',
            string: '1.1',
            child: { type: 'Component', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "component": {
          "child2": {
            "child2": {
              "child2": null,
              "string2": "1.1.1",
              "type": "Component",
            },
            "string2": "1.1",
            "type": "Component",
          },
          "string2": "1",
          "type": "Component",
        },
        "componentList": null,
        "richText": null,
      }
    `);
  });

  test('component in rich text', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            {
              action: 'renameField',
              componentType: 'Component',
              field: 'string',
              newName: 'string2',
            },
            {
              action: 'renameField',
              componentType: 'Component',
              field: 'child',
              newName: 'child2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
            type: 'Component',
            string: '1',
            child: { type: 'Component', string: '1.1', child: null },
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
          "type": "Component",
        },
        "string2": "1",
        "type": "Component",
      }
    `);
  });
});

describe('applySchemaMigrationsToFields deleteField', () => {
  test('nested component', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'deleteField', componentType: 'Component', field: 'string' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
            type: 'Component',
            string: '1',
            child: { type: 'Component', string: '1.1', child: null },
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
            "type": "Component",
          },
          "type": "Component",
        }
      `);
  });

  test('component in rich text', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'deleteField', componentType: 'Component', field: 'string' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        component: {
          type: 'Component',
          string: '1',
          child: {
            type: 'Component',
            string: '1.1',
            child: { type: 'Component', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "component": {
          "child": {
            "child": {
              "child": null,
              "type": "Component",
            },
            "type": "Component",
          },
          "type": "Component",
        },
        "componentList": null,
        "richText": null,
      }
    `);
  });
});

describe('applySchemaMigrationsToFields renameType', () => {
  test('nested component', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', componentType: 'Component', newName: 'Component2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        component: {
          type: 'Component',
          string: '1',
          child: {
            type: 'Component',
            string: '1.1',
            child: { type: 'Component', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "component": {
          "child": {
            "child": {
              "child": null,
              "string": "1.1.1",
              "type": "Component2",
            },
            "string": "1.1",
            "type": "Component2",
          },
          "string": "1",
          "type": "Component2",
        },
        "componentList": null,
        "richText": null,
      }
    `);
  });

  test('component list', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', componentType: 'Component', newName: 'Component2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        componentList: [{ type: 'Component', string: '1', child: null }],
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "component": null,
        "componentList": [
          {
            "child": null,
            "string": "1",
            "type": "Component2",
          },
        ],
        "richText": null,
      }
    `);
  });

  test('component in rich text', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'renameType', componentType: 'Component', newName: 'Component2' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
            type: 'Component',
            string: '1',
            child: { type: 'Component', string: '1.1', child: null },
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
          "type": "Component2",
        },
        "string": "1",
        "type": "Component2",
      }
    `);
  });
});

describe('applySchemaMigrationsToFields deleteType', () => {
  test('nested component', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'Component' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        component: {
          type: 'Component',
          string: '1',
          child: {
            type: 'Component',
            string: '1.1',
            child: { type: 'Component', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
  });

  test('component list', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'Component' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        componentList: [{ type: 'Component', string: '1', child: null }],
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
  });

  test('component in rich text', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'Component' }] }],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        richText: createRichText([
          createRichTextHeadingNode('h1', [createRichTextTextNode('Heading 1')]),
          createRichTextComponentNode({
            type: 'Component',
            string: '1',
            child: { type: 'Component', string: '1.1', child: null },
          }),
        ]),
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchSnapshot();
  });
});

describe('applySchemaMigrationsToFields combos', () => {
  test('rename type and field', () => {
    const schema = ADMIN_SCHEMA_BASE.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [
            { action: 'renameType', componentType: 'Component', newName: 'Component2' },
            {
              action: 'renameField',
              componentType: 'Component2',
              field: 'string',
              newName: 'string2',
            },
          ],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFields(schema, 'Entity', {
      schemaVersion: 1,
      encodeVersion: ENCODE_VERSION_AS_IS,
      fields: {
        component: {
          type: 'Component',
          string: '1',
          child: {
            type: 'Component',
            string: '1.1',
            child: { type: 'Component', string: '1.1.1', child: null },
          },
        },
      },
    }).valueOrThrow();
    expect(fieldValues).toMatchInlineSnapshot(`
      {
        "component": {
          "child": {
            "child": {
              "child": null,
              "string2": "1.1.1",
              "type": "Component2",
            },
            "string2": "1.1",
            "type": "Component2",
          },
          "string2": "1",
          "type": "Component2",
        },
        "componentList": null,
        "richText": null,
      }
    `);
  });
});
