import { CoreTestUtils } from '@jonasb/datadata-core';
import { createMockAdapter, createMockContext, getQueryCalls } from '../test/TestUtils';
import { authCreateSession } from './createSession';
const { expectOkResult, expectResultValue } = CoreTestUtils;

describe('authCreateSession', () => {
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

    const result = await authCreateSession(adapter, context, 'test', 'hello');
    if (expectOkResult(result)) {
      const {
        session: { subjectId },
      } = result.value;
      expectResultValue(result, {
        principalEffect: 'created',
        session: { subjectInternalId: 123, subjectId },
      });

      expect(getQueryCalls(adapter)).toEqual([
        [
          `SELECT s.id, s.uuid FROM subjects s, principals p
    WHERE p.provider = ?1 AND p.identifier = ?2 AND p.subjects_id = s.id`,
          'test',
          'hello',
        ],
        ['BEGIN'],
        [
          'INSERT INTO subjects (uuid, created_at) VALUES (?1, ?2) RETURNING id',
          subjectId,
          expect.anything(),
        ],
        [
          'INSERT INTO principals (provider, identifier, subjects_id) VALUES (?1, ?2, ?3)',
          'test',
          'hello',
          123,
        ],
        ['COMMIT'],
      ]);
    }
  });

  test('Existing principal', async () => {
    const adapter = createMockAdapter();
    const contextResult = await createMockContext(adapter);
    if (contextResult.isError()) throw contextResult.toError();
    const context = contextResult.value;

    adapter.query.mockClear();
    adapter.query.mockImplementation(async (query, _values) => {
      if (query.startsWith('SELECT s.id, s.uuid FROM')) return [{ id: 123 }];
      return [];
    });

    const result = await authCreateSession(adapter, context, 'test', 'hello');
    if (expectOkResult(result)) {
      const {
        session: { subjectId },
      } = result.value;
      expectResultValue(result, {
        principalEffect: 'none',
        session: { subjectInternalId: 123, subjectId },
      });

      expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
        Array [
          Array [
            "SELECT s.id, s.uuid FROM subjects s, principals p
            WHERE p.provider = ?1 AND p.identifier = ?2 AND p.subjects_id = s.id",
            "test",
            "hello",
          ],
        ]
      `);
    }
  });
});
