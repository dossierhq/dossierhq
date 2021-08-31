import { CoreTestUtils } from '@jonasb/datadata-core';
import { createMockAdapter, createMockContext, getQueryCalls } from '../TestUtils';
import { authCreatePrincipal } from './createPrincipal';
const { expectResultValue } = CoreTestUtils;

describe('authCreatePrincipal', () => {
  test('Create new principal', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation(async (_transaction, query, _values) => {
      if (query.startsWith('INSERT INTO subjects')) return [{ id: 123, uuid: '4321' }];
      return [];
    });
    const result = await authCreatePrincipal(adapter, context, 'test', 'hello');
    expectResultValue(result, { subjectInternalId: 123, subjectId: '4321' });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "BEGIN",
        ],
        Array [
          "INSERT INTO subjects DEFAULT VALUES RETURNING id, uuid",
        ],
        Array [
          "INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)",
          "test",
          "hello",
          123,
        ],
        Array [
          "COMMIT",
        ],
      ]
    `);
  });
});
