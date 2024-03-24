import { ErrorType, ok } from '@dossierhq/core';
import { expectErrorResult, expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import { authCreateSession, verifyAuthKeysFormat } from './Auth.js';
import {
  createMockDatabaseAdapter,
  createMockTransactionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from './test/AdditionalTestUtils.js';

describe('Auth authCreateSession', () => {
  test('Success', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const context = createMockTransactionContext();

    databaseAdapter.authCreateSession.mockReturnValueOnce(
      Promise.resolve(
        ok({ principalEffect: 'created', session: { type: 'write', subjectId: '1-2-3' } }),
      ),
    );
    const result = await authCreateSession(databaseAdapter, context, 'test', 'hello', false);

    expectResultValue(result, {
      principalEffect: 'created',
      session: { type: 'write', subjectId: '1-2-3' },
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "authCreateSession",
            "test",
            "hello",
            false,
          ],
        ]
      `);
  });
});

describe('Auth verifyAuthKeysFormat', () => {
  test('Ok', () => {
    expectOkResult(verifyAuthKeysFormat(['', 'subject']));
  });

  test('Error: Initial whitespace', () => {
    expectErrorResult(
      verifyAuthKeysFormat(['', ' subject']),
      ErrorType.BadRequest,
      'Invalid authKey ( subject), can’t start with whitespace',
    );
  });

  test('Error: Ending whitespace', () => {
    expectErrorResult(
      verifyAuthKeysFormat(['', 'subject ']),
      ErrorType.BadRequest,
      'Invalid authKey (subject ), can’t end with whitespace',
    );
  });

  test('Error: Comma', () => {
    expectErrorResult(
      verifyAuthKeysFormat(['', 'sub,ject']),
      ErrorType.BadRequest,
      'Invalid authKey (sub,ject), can’t contain comma',
    );
  });
});
