import { describe, expect, test } from 'vitest';
import { forTest } from './EntityCodec.js';
import { AdminSchemaWithMigrations, FieldType } from '@dossierhq/core';

const { applySchemaMigrationsToFieldValues } = forTest;

const ADMIN_SCHEMA_NESTED_VALUE_ITEM = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [{ name: 'Entity', fields: [{ name: 'field', type: FieldType.ValueItem }] }],
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
    const adminSchema = ADMIN_SCHEMA_NESTED_VALUE_ITEM.updateAndValidate({
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
      field: {
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
        "field": {
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
});

describe('applySchemaMigrationsToFieldValues deleteField', () => {
  test('nested value item', () => {
    const adminSchema = ADMIN_SCHEMA_NESTED_VALUE_ITEM.updateAndValidate({
      migrations: [
        {
          version: 2,
          actions: [{ action: 'deleteField', valueType: 'ValueItem', field: 'string' }],
        },
      ],
    }).valueOrThrow();

    const fieldValues = applySchemaMigrationsToFieldValues(adminSchema, 'Entity', 1, {
      field: {
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
        "field": {
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
