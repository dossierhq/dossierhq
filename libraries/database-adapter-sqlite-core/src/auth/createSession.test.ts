import { expectOkResult, expectResultValue } from '@jonasb/datadata-core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockContext,
  createMockInnerAndOuterAdapter,
  getQueryCalls,
} from '../test/TestUtils.js';

describe('authCreateSession', () => {
  test('Create new principal', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.query.mockClear();
    innerAdapter.query.mockImplementation(async (query, _values) => {
      if (query.startsWith('INSERT INTO subjects')) return [{ id: 123 }];
      return [];
    });

    const result = await outerAdapter.authCreateSession(context, 'test', 'hello');
    if (expectOkResult(result)) {
      const {
        session: { subjectId },
      } = result.value;
      expectResultValue(result, {
        principalEffect: 'created',
        session: { subjectId },
      });

      expect(getQueryCalls(innerAdapter)).toEqual([
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
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.query.mockClear();
    innerAdapter.query.mockImplementation(async (query, _values) => {
      if (query.startsWith('SELECT s.id, s.uuid FROM')) return [{ id: 123 }];
      return [];
    });

    const result = await outerAdapter.authCreateSession(context, 'test', 'hello');
    if (expectOkResult(result)) {
      const {
        session: { subjectId },
      } = result.value;
      expectResultValue(result, {
        principalEffect: 'none',
        session: { subjectId },
      });

      expect(getQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
        [
          [
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
