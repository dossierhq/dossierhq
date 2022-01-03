import { expectResultValue } from '@jonasb/datadata-core-jest';
import { createMockAdapter, createMockContext, getQueryCalls } from '../test/TestUtils';
import { authCreateSession } from './createSession';

describe('authCreateSession', () => {
  test('Create new principal', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation(async (_transaction, query, _values) => {
      if (query.startsWith('INSERT INTO subjects')) return [{ id: 123, uuid: '4321' }];
      return [];
    });
    const result = await authCreateSession(adapter, context, 'test', 'hello');
    expectResultValue(result, {
      principalEffect: 'created',
      session: { subjectInternalId: 123, subjectId: '4321' },
    });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT s.id, s.uuid FROM subjects s, principals p
          WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id",
          "test",
          "hello",
        ],
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

  test('Existing principal', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation(async (_transaction, query, _values) => {
      if (query.startsWith('SELECT s.id, s.uuid FROM')) return [{ id: 123, uuid: '4321' }];
      return [];
    });
    const result = await authCreateSession(adapter, context, 'test', 'hello');
    expectResultValue(result, {
      principalEffect: 'none',
      session: { subjectInternalId: 123, subjectId: '4321' },
    });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT s.id, s.uuid FROM subjects s, principals p
          WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id",
          "test",
          "hello",
        ],
      ]
    `);
  });
});
