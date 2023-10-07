import { ok, type AdminSchemaSpecificationWithMigrations } from '@dossierhq/core';
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
      schemaKind: 'admin',
      version: 0,
      entityTypes: [],
      componentTypes: [],
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
      schemaKind: 'admin',
      version: 1,
      migrations: [],
      entityTypes: [
        { name: 'Foo', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
      ],
      componentTypes: [{ name: 'Bar', adminOnly: false, fields: [] }],
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
});
