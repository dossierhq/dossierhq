import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import { createMockAdapter, createMockContext, getQueryCalls } from '../test/TestUtils.js';
import { authCreateSession } from './createSession.js';

describe('authCreateSession', () => {
  test('Create new principal', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, query, _values) => {
      let result;
      if (query.startsWith('INSERT INTO subjects')) result = { rows: [{ id: 123, uuid: '4321' }] };
      else result = { rows: [] };
      return Promise.resolve(result);
    });
    const result = await authCreateSession(adapter, context, 'test', 'hello');
    expectResultValue(result, {
      principalEffect: 'created',
      session: { subjectId: '4321' },
    });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT s.id, s.uuid FROM subjects s, principals p
          WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id",
          "test",
          "hello",
        ],
        [
          "BEGIN",
        ],
        [
          "INSERT INTO subjects DEFAULT VALUES RETURNING id, uuid",
        ],
        [
          "INSERT INTO principals (provider, identifier, subjects_id) VALUES ($1, $2, $3)",
          "test",
          "hello",
          123,
        ],
        [
          "COMMIT",
        ],
      ]
    `);
  });

  test('Existing principal', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, query, _values) => {
      if (query.startsWith('SELECT s.id, s.uuid FROM')) {
        return Promise.resolve({ rows: [{ id: 123, uuid: '4321' }] });
      }
      return Promise.resolve({ rows: [] });
    });
    const result = await authCreateSession(adapter, context, 'test', 'hello');
    expectResultValue(result, {
      principalEffect: 'none',
      session: { subjectId: '4321' },
    });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT s.id, s.uuid FROM subjects s, principals p
          WHERE p.provider = $1 AND p.identifier = $2 AND p.subjects_id = s.id",
          "test",
          "hello",
        ],
      ]
    `);
  });
});
