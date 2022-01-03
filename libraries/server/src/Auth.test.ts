import { ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-jest';
import { authCreateSession } from './Auth';
import {
  createMockDatabaseAdapter,
  createMockTransactionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from './test/AdditionalTestUtils';

describe('Auth authCreateSession', () => {
  test('Success', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

    databaseAdapter.authCreateSession.mockReturnValueOnce(
      Promise.resolve(
        ok({ principalEffect: 'created', session: { subjectInternalId: 123, subjectId: '1-2-3' } })
      )
    );
    const result = await authCreateSession(databaseAdapter, context, 'test', 'hello');

    expectResultValue(result, {
      principalEffect: 'created',
      session: { subjectInternalId: 123, subjectId: '1-2-3' },
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "authCreateSession",
          "test",
          "hello",
        ],
      ]
    `);
  });
});
