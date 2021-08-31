import { CoreTestUtils, ok } from '@jonasb/datadata-core';
import { createPrincipal } from './Auth';
import {
  createMockAuthContext,
  createMockDatabaseAdapter,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from './test/AdditionalTestUtils';

const { expectResultValue } = CoreTestUtils;

describe('Auth createPrincipal', () => {
  test('Success', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authContext = createMockAuthContext(databaseAdapter);

    databaseAdapter.authCreatePrincipal.mockReturnValueOnce(
      Promise.resolve(ok({ subjectInternalId: 123, subjectId: '1-2-3' }))
    );
    const result = await createPrincipal(authContext, 'test', 'hello');

    expectResultValue(result, '1-2-3');
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "authCreatePrincipal",
          "test",
          "hello",
        ],
      ]
    `);
  });
});
