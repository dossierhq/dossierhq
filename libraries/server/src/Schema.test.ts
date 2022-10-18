import type { AdminSchemaSpecification } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-vitest';
import { describe, expect, test } from 'vitest';
import { getSchemaSpecification } from './Schema.js';
import {
  createMockDatabaseAdapter,
  createMockTransactionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from './test/AdditionalTestUtils.js';

describe('AdminSchema getSchema', () => {
  test('No schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(null)));
    const result = await getSchemaSpecification(databaseAdapter, context);

    // defaults to empty spec
    expectResultValue(result, { entityTypes: [], valueTypes: [], patterns: [], indexes: [] });
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

    const schemaSpec: AdminSchemaSpecification = {
      entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] }],
      valueTypes: [{ name: 'Bar', adminOnly: false, fields: [] }],
      patterns: [],
      indexes: [],
    };
    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(schemaSpec)));
    const result = await getSchemaSpecification(databaseAdapter, context);

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
