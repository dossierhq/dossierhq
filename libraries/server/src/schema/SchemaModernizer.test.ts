import {
  FieldType,
  RichTextNodeType,
  type SchemaSpecificationWithMigrations,
  type LegacySchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { modernizeSchemaSpecification } from './SchemaModernizer.js';

describe('modernizeSchemaSpecification', () => {
  test('Version <=0.2.2 schema', () => {
    const schemaSpec = {
      version: 1,
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          authKeyPattern: null,
          // there was no nameField in <=0.2.2
          fields: [
            {
              name: 'title',
              type: FieldType.String,
              isName: true, // this was removed in 0.2.3
              adminOnly: false,
              index: null,
              matchPattern: null,
              list: false,
              multiline: false,
              required: false,
            },
          ],
        },
      ],
      valueTypes: [],
      patterns: [],
      indexes: [],
    } as unknown as LegacySchemaSpecificationWithMigrations;
    expect(modernizeSchemaSpecification(schemaSpec)).toEqual<SchemaSpecificationWithMigrations>({
      schemaKind: 'full',
      version: 1,
      migrations: [],
      entityTypes: [
        {
          name: 'Foo',
          publishable: true,
          authKeyPattern: null,
          nameField: 'title',
          fields: [
            {
              name: 'title',
              type: 'String',
              list: false,
              adminOnly: false,
              index: null,
              matchPattern: null,
              values: [],
              multiline: false,
              required: false,
            },
          ],
        },
      ],
      indexes: [],
      patterns: [],
      componentTypes: [],
    });
  });

  test('Version <=0.2.14 schema', () => {
    const schemaSpec = {
      version: 1,
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          authKeyPattern: null,
          nameField: 'title',
          fields: [
            {
              name: 'title',
              type: FieldType.String,
              adminOnly: false,
              index: null,
              matchPattern: null,
              list: false,
              multiline: false,
              required: false,
              // No values field on string fields in <=0.2.14
            },
          ],
        },
      ],
      valueTypes: [],
      patterns: [],
      indexes: [],
    } as unknown as LegacySchemaSpecificationWithMigrations;
    expect(modernizeSchemaSpecification(schemaSpec)).toEqual<SchemaSpecificationWithMigrations>({
      schemaKind: 'full',
      version: 1,
      entityTypes: [
        {
          name: 'Foo',
          publishable: true,
          authKeyPattern: null,
          nameField: 'title',
          fields: [
            {
              name: 'title',
              type: 'String',
              list: false,
              adminOnly: false,
              index: null,
              matchPattern: null,
              values: [],
              multiline: false,
              required: false,
            },
          ],
        },
      ],
      indexes: [],
      patterns: [],
      componentTypes: [],
      migrations: [],
    });
  });

  test('Version <=0.3.2 schema', () => {
    const schemaSpec = {
      version: 1,
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          authKeyPattern: null,
          nameField: null,
          fields: [
            {
              name: 'rt',
              type: FieldType.RichText,
              adminOnly: false,
              list: false,
              required: false,
              // tab became required in 0.3.2
              richTextNodes: [
                RichTextNodeType.linebreak,
                RichTextNodeType.root,
                RichTextNodeType.text,
              ],
              entityTypes: [],
              linkEntityTypes: [],
              valueTypes: [],
            },
          ],
        },
      ],
      valueTypes: [],
      patterns: [],
      indexes: [],
    } as unknown as SchemaSpecificationWithMigrations;

    expect(modernizeSchemaSpecification(schemaSpec)).toEqual<SchemaSpecificationWithMigrations>({
      schemaKind: 'full',
      version: 1,
      migrations: [],
      entityTypes: [
        {
          name: 'Foo',
          publishable: true,
          authKeyPattern: null,
          nameField: null,
          fields: [
            {
              name: 'rt',
              type: FieldType.RichText,
              adminOnly: false,
              list: false,
              required: false,
              richTextNodes: [
                RichTextNodeType.linebreak,
                RichTextNodeType.root,
                RichTextNodeType.tab,
                RichTextNodeType.text,
              ],
              entityTypes: [],
              linkEntityTypes: [],
              componentTypes: [],
            },
          ],
        },
      ],
      componentTypes: [],
      patterns: [],
      indexes: [],
    });
  });

  test('Version <=0.4.7 schema', () => {
    const schemaSpec: LegacySchemaSpecificationWithMigrations = {
      version: 2,
      schemaKind: 'full',
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          authKeyPattern: null,
          nameField: null,
          fields: [
            {
              name: 'component',
              type: 'ValueItem', // was renamed to Component
              adminOnly: false,
              list: false,
              required: false,
              valueTypes: ['ValueItem1'], // was renamed to componentTypes
            },
            {
              name: 'richText',
              type: FieldType.RichText,
              adminOnly: false,
              list: false,
              required: false,
              richTextNodes: ['text', 'linebreak', 'paragraph', 'root', 'tab', 'valueItem'], // valueItem was renamed to component
              entityTypes: [],
              linkEntityTypes: [],
              valueTypes: ['ValueItem1'], // was renamed to componentTypes
            },
          ],
        },
      ],
      // valueTypes was renamed to componentTypes
      valueTypes: [
        {
          name: 'ValueItem1',
          adminOnly: false,
          fields: [
            {
              name: 'component',
              type: 'ValueItem', // was renamed to Component
              adminOnly: false,
              list: false,
              required: false,
              valueTypes: ['ValueItem1'], // was renamed to componentTypes
            },
            {
              name: 'richText',
              type: FieldType.RichText,
              adminOnly: false,
              list: false,
              required: false,
              richTextNodes: [],
              entityTypes: [],
              linkEntityTypes: [],
              valueTypes: ['ValueItem1'], // was renamed to componentTypes
            },
          ],
        },
      ],
      patterns: [],
      indexes: [],
      migrations: [
        {
          version: 1,
          actions: [
            // valueType was renamed to componentType
            { action: 'deleteType', valueType: 'DeletedName' },
            { action: 'renameType', valueType: 'OldName', newName: 'ValueItem1' },
            {
              action: 'renameField',
              valueType: 'ValueItem1',
              field: 'oldName',
              newName: 'richText',
            },
            { action: 'deleteField', valueType: 'ValueItem1', field: 'deletedField' },
          ],
        },
      ],
    };

    expect(modernizeSchemaSpecification(schemaSpec)).toEqual<SchemaSpecificationWithMigrations>({
      schemaKind: 'full',
      version: 2,
      entityTypes: [
        {
          name: 'Foo',
          publishable: true,
          authKeyPattern: null,
          nameField: null,
          fields: [
            {
              name: 'component',
              type: FieldType.Component,
              adminOnly: false,
              list: false,
              required: false,
              componentTypes: ['ValueItem1'],
            },
            {
              name: 'richText',
              type: FieldType.RichText,
              adminOnly: false,
              list: false,
              required: false,
              richTextNodes: ['component', 'linebreak', 'paragraph', 'root', 'tab', 'text'],
              entityTypes: [],
              linkEntityTypes: [],
              componentTypes: ['ValueItem1'],
            },
          ],
        },
      ],
      componentTypes: [
        {
          name: 'ValueItem1',
          adminOnly: false,
          fields: [
            {
              name: 'component',
              type: FieldType.Component,
              adminOnly: false,
              list: false,
              required: false,
              componentTypes: ['ValueItem1'],
            },
            {
              name: 'richText',
              type: FieldType.RichText,
              adminOnly: false,
              list: false,
              required: false,
              richTextNodes: [],
              entityTypes: [],
              linkEntityTypes: [],
              componentTypes: ['ValueItem1'],
            },
          ],
        },
      ],
      patterns: [],
      indexes: [],
      migrations: [
        {
          version: 1,
          actions: [
            { action: 'deleteType', componentType: 'DeletedName' },
            { action: 'renameType', componentType: 'OldName', newName: 'ValueItem1' },
            {
              action: 'renameField',
              componentType: 'ValueItem1',
              field: 'oldName',
              newName: 'richText',
            },
            { action: 'deleteField', componentType: 'ValueItem1', field: 'deletedField' },
          ],
        },
      ],
    });
  });

  test('Version <=0.7 schema', () => {
    const schemaSpec: LegacySchemaSpecificationWithMigrations = {
      version: 2,
      schemaKind: 'full',
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          authKeyPattern: null,
          nameField: null,
          fields: [
            {
              name: 'reference',
              type: 'Entity', // was renamed to Reference
              adminOnly: false,
              list: false,
              required: false,
              entityTypes: [],
            },
          ],
        },
      ],
      componentTypes: [
        {
          name: 'Component1',
          adminOnly: false,
          fields: [
            {
              name: 'reference',
              type: 'Entity', // was renamed to Reference
              adminOnly: false,
              list: true,
              required: false,
              entityTypes: [],
            },
          ],
        },
      ],
      patterns: [],
      indexes: [],
      migrations: [],
    };

    expect(modernizeSchemaSpecification(schemaSpec)).toEqual<SchemaSpecificationWithMigrations>({
      schemaKind: 'full',
      version: 2,
      entityTypes: [
        {
          name: 'Foo',
          publishable: true,
          authKeyPattern: null,
          nameField: null,
          fields: [
            {
              name: 'reference',
              type: FieldType.Reference,
              adminOnly: false,
              list: false,
              required: false,
              entityTypes: [],
            },
          ],
        },
      ],
      componentTypes: [
        {
          name: 'Component1',
          adminOnly: false,
          fields: [
            {
              name: 'reference',
              type: FieldType.Reference,
              adminOnly: false,
              list: true,
              required: false,
              entityTypes: [],
            },
          ],
        },
      ],
      patterns: [],
      indexes: [],
      migrations: [],
    });
  });
});
