import type { SchemaSpecification } from '@jonasb/datadata-core';
import { CoreTestUtils, ok, Schema } from '@jonasb/datadata-core';
import { getSchema } from './Schema';
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

    databaseAdapter.schemaGet.mockReturnValueOnce(Promise.resolve(ok(null)));
    const result = await getSchema(databaseAdapter, context);

    // defaults to empty spec
    expectResultValue(result, new Schema({ entityTypes: [], valueTypes: [] }));
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "schemaGet",
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
    databaseAdapter.schemaGet.mockReturnValueOnce(Promise.resolve(ok(schemaSpec)));
    const result = await getSchema(databaseAdapter, context);

    expectResultValue(result, new Schema(schemaSpec));
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "schemaGet",
        ],
      ]
    `);
  });
});
