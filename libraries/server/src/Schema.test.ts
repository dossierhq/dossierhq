import type { SchemaSpecification } from '@jonasb/datadata-core';
import { CoreTestUtils, ok } from '@jonasb/datadata-core';
import { getSchemaSpecification } from './Schema';
import {
  createMockDatabaseAdapter,
  createMockTransactionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from './test/AdditionalTestUtils';

const { expectResultValue } = CoreTestUtils;

describe('Schema getSchema', () => {
  test('No schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(null)));
    const result = await getSchemaSpecification(databaseAdapter, context);

    // defaults to empty spec
    expectResultValue(result, { entityTypes: [], valueTypes: [] });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "schemaGetSpecification",
        ],
      ]
    `);
  });

  test('Small schema', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

    const schemaSpec: SchemaSpecification = {
      entityTypes: [{ name: 'Foo', fields: [] }],
      valueTypes: [{ name: 'Bar', fields: [] }],
    };
    databaseAdapter.schemaGetSpecification.mockReturnValueOnce(Promise.resolve(ok(schemaSpec)));
    const result = await getSchemaSpecification(databaseAdapter, context);

    expectResultValue(result, schemaSpec);
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "schemaGetSpecification",
        ],
      ]
    `);
  });
});
