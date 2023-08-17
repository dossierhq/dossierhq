import type { ChangelogQuery, Paging } from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { createMockDatabase, resolvePaging } from '../test/TestUtils.js';
import {
  generateGetChangelogEventsQuery,
  generateGetChangelogTotalCountQuery,
} from './ChangelogQueryGenerator.js';

function getChangelogEventsQuery(query?: ChangelogQuery, paging?: Paging) {
  const database = createMockDatabase();
  return generateGetChangelogEventsQuery(database, query ?? {}, resolvePaging(paging));
}

describe('generateGetChangelogEventsQuery', () => {
  test('default', () => {
    expect(getChangelogEventsQuery().valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE 1=1 ORDER BY e.id LIMIT ?1",
        "values": [
          26,
        ],
      }
    `);
  });

  test('reverse', () => {
    expect(getChangelogEventsQuery({ reverse: true }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE 1=1 ORDER BY e.id DESC LIMIT ?1",
        "values": [
          26,
        ],
      }
    `);
  });

  test('createdBy', () => {
    expect(getChangelogEventsQuery({ createdBy: '1-2-3' }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE s.uuid = ?1 ORDER BY e.id LIMIT ?2",
        "values": [
          "1-2-3",
          26,
        ],
      }
    `);
  });

  test('schema only', () => {
    expect(getChangelogEventsQuery({ schema: true }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE e.type = ?1 ORDER BY e.id LIMIT ?2",
        "values": [
          "updateSchema",
          26,
        ],
      }
    `);
  });

  test('schema only - createdBy', () => {
    expect(getChangelogEventsQuery({ schema: true, createdBy: '1-2-3' }).valueOrThrow())
      .toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE s.uuid = ?1 AND e.type = ?2 ORDER BY e.id LIMIT ?3",
        "values": [
          "1-2-3",
          "updateSchema",
          26,
        ],
      }
    `);
  });
});

describe('generateGetChangelogTotalCountQuery', () => {
  test('default', () => {
    expect(generateGetChangelogTotalCountQuery({}).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT COUNT(*) AS count FROM events e WHERE 1=1",
        "values": [],
      }
    `);
  });

  test('reverse', () => {
    expect(generateGetChangelogTotalCountQuery({ reverse: true }).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "text": "SELECT COUNT(*) AS count FROM events e WHERE 1=1",
          "values": [],
        }
      `);
  });

  test('createdBy', () => {
    expect(generateGetChangelogTotalCountQuery({ createdBy: '1-2-3' }).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "text": "SELECT COUNT(*) AS count FROM events e WHERE s.uuid = ?1",
          "values": [
            "1-2-3",
          ],
        }
      `);
  });

  test('schema only', () => {
    expect(generateGetChangelogTotalCountQuery({ schema: true }).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "text": "SELECT COUNT(*) AS count FROM events e WHERE e.type = ?1",
          "values": [
            "updateSchema",
          ],
        }
      `);
  });

  test('schema only - createdBy', () => {
    expect(generateGetChangelogTotalCountQuery({ schema: true, createdBy: '1-2-3' }).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "text": "SELECT COUNT(*) AS count FROM events e WHERE s.uuid = ?1 AND e.type = ?2",
          "values": [
            "1-2-3",
            "updateSchema",
          ],
        }
      `);
  });
});
