import { EventType } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockContext,
  createMockInnerAndOuterAdapter,
  getRunAndQueryCalls,
} from '../test/TestUtils.js';

describe('authCreateSession', () => {
  test('Create new principal', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (query, _values) => {
      if (query.startsWith('INSERT INTO subjects')) return [{ id: 123 }];
      if (query.startsWith('INSERT INTO principals')) return [{ id: 456 }];
      return [];
    };

    const result = await outerAdapter.authCreateSession(context, 'test', 'hello', false, null);
    const {
      session: { subjectId },
    } = result.valueOrThrow();
    expectResultValue(result, {
      principalEffect: 'created',
      session: { type: 'write', subjectId },
    });

    expect(getRunAndQueryCalls(innerAdapter)).toEqual([
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
        'INSERT INTO principals (provider, identifier, subjects_id) VALUES (?1, ?2, ?3) RETURNING id',
        'test',
        'hello',
        123,
      ],
      [
        'INSERT INTO events (uuid, type, created_by, created_at, principals_id) VALUES (?1, ?2, ?3, ?4, ?5)',
        expect.anything(),
        EventType.createPrincipal,
        123,
        expect.anything(),
        456,
      ],
      ['COMMIT'],
    ]);
  });

  test('Existing principal', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (query, _values) => {
      if (query.startsWith('SELECT s.id, s.uuid FROM')) return [{ id: 123 }];
      return [];
    };

    const result = await outerAdapter.authCreateSession(context, 'test', 'hello', false, null);
    const {
      session: { subjectId },
    } = result.valueOrThrow();
    expectResultValue(result, {
      principalEffect: 'none',
      session: { type: 'write', subjectId },
    });

    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
        [
          [
            "SELECT s.id, s.uuid FROM subjects s, principals p
            WHERE p.provider = ?1 AND p.identifier = ?2 AND p.subjects_id = s.id",
            "test",
            "hello",
          ],
        ]
      `);
  });
});
