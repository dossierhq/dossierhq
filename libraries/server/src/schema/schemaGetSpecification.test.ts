import {
  FieldType,
  RichTextNodeType,
  ok,
  type AdminSchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockDatabaseAdapter,
  createMockTransactionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { schemaGetSpecification } from './schemaGetSpecification.js';

describe('schemaGetSpecification', () => {
  test('No schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(null)));
    const result = await schemaGetSpecification(databaseAdapter, context, false);

    // defaults to empty spec
    expectResultValue(result, {
      version: 0,
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
      migrations: [],
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "schemaGetSpecification",
          ],
        ]
      `);
  });

  test('Small schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

    const schemaSpec: AdminSchemaSpecificationWithMigrations = {
      version: 1,
      migrations: [],
      entityTypes: [
        { name: 'Foo', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
      ],
      valueTypes: [{ name: 'Bar', adminOnly: false, fields: [] }],
      patterns: [],
      indexes: [],
    };
    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(schemaSpec)));
    const result = await schemaGetSpecification(databaseAdapter, context, false);

    expectResultValue(result, schemaSpec);
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "schemaGetSpecification",
          ],
        ]
      `);
  });

  test('Version <=0.2.2 schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

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
    } as unknown as AdminSchemaSpecificationWithMigrations;
    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(schemaSpec)));
    const result = await schemaGetSpecification(databaseAdapter, context, false);
    expect(result.valueOrThrow()).toEqual<AdminSchemaSpecificationWithMigrations>({
      version: 1,
      migrations: [],
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
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
      valueTypes: [],
    });
  });

  test('Version <=0.2.14 schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

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
    } as unknown as AdminSchemaSpecificationWithMigrations;
    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(schemaSpec)));
    const result = await schemaGetSpecification(databaseAdapter, context, false);
    expect(result.valueOrThrow()).toEqual<AdminSchemaSpecificationWithMigrations>({
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
      valueTypes: [],
      migrations: [],
    });
  });

  test('Version <=0.3.2 schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

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
    } as unknown as AdminSchemaSpecificationWithMigrations;
    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(schemaSpec)));
    const result = await schemaGetSpecification(databaseAdapter, context, false);
    expect(result.valueOrThrow()).toEqual<AdminSchemaSpecificationWithMigrations>({
      version: 1,
      migrations: [],
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
              richTextNodes: [
                RichTextNodeType.linebreak,
                RichTextNodeType.root,
                RichTextNodeType.tab,
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
    });
  });
});
