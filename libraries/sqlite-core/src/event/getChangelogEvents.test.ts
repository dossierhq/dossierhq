import { describe, expect, test } from 'vitest';
import { forTest } from './getChangelogEvents.js';
import type { ChangelogQuery, Paging } from '@dossierhq/core';
import { createMockDatabase, resolvePaging } from '../test/TestUtils.js';

const { generateGetChangelogEventsQuery } = forTest;

function getQuery(query?: ChangelogQuery, paging?: Paging) {
  const database = createMockDatabase();
  return generateGetChangelogEventsQuery(database, query ?? {}, resolvePaging(paging));
}

describe('generateGetChangelogEventsQuery', () => {
  test('default', () => {
    expect(getQuery().valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE 1=1 ORDER BY e.id LIMIT ?1",
        "values": [
          26,
        ],
      }
    `);
  });

  test('reverse', () => {
    expect(getQuery({ reverse: true }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE 1=1 ORDER BY e.id DESC LIMIT ?1",
        "values": [
          26,
        ],
      }
    `);
  });

  test('createdBy', () => {
    expect(getQuery({ createdBy: '1-2-3' }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE s.uuid = ?1 ORDER BY e.id LIMIT ?2",
        "values": [
          "1-2-3",
          26,
        ],
      }
    `);
  });

  test('schema only', () => {
    expect(getQuery({ schema: true }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE e.type = ?1 ORDER BY e.id LIMIT ?2",
        "values": [
          "updateSchema",
          26,
        ],
      }
    `);
  });

  test('schema only - createdBy', () => {
    expect(getQuery({ schema: true, createdBy: '1-2-3' }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE s.uuid = ?1 AND e.type = ?2 ORDER BY e.id LIMIT ?3",
        "values": [
          "1-2-3",
          "updateSchema",
          26,
        ],
      }
    `);
  });
});
