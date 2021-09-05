import { CoreTestUtils } from '@jonasb/datadata-core';
import { expectOkResult } from '@jonasb/datadata-core/lib/cjs/CoreTestUtils';
import { createMockAdapter, createMockContext, getQueryCalls } from '../test/TestUtils';
import { authCreatePrincipal } from './createPrincipal';
const { expectResultValue } = CoreTestUtils;

describe('authCreatePrincipal', () => {
  test('Create new principal', async () => {
    const adapter = createMockAdapter();
    const contextResult = await createMockContext(adapter);
    if (contextResult.isError()) throw contextResult.toError();
    const context = contextResult.value;

    adapter.query.mockClear();
    adapter.query.mockImplementation(async (query, _values) => {
      if (query.startsWith('INSERT INTO subjects')) return [{ id: 123 }];
      return [];
    });

    const result = await authCreatePrincipal(adapter, context, 'test', 'hello');
    if (expectOkResult(result)) {
      const { subjectId } = result.value;
      expectResultValue(result, { subjectInternalId: 123, subjectId });

      expect(getQueryCalls(adapter)).toEqual([
        ['BEGIN'],
        [
          'INSERT INTO subjects (uuid, created_at) VALUES ($1, $2) RETURNING id',
          subjectId,
          expect.anything(),
        ],
        [
          'INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)',
          'test',
          'hello',
          123,
        ],
        ['COMMIT'],
      ]);
    }
  });
});
