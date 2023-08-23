import { EventType, type ChangelogEventQuery, type Paging } from '@dossierhq/core';
import type { DatabaseResolvedEntityReference } from '@dossierhq/database-adapter';
import { describe, expect, test } from 'vitest';
import { createMockDatabase, resolvePaging } from '../test/TestUtils.js';
import {
  generateGetChangelogEventsQuery,
  generateGetChangelogTotalCountQuery,
} from './ChangelogQueryGenerator.js';

function getChangelogEventsQuery(
  query?: ChangelogEventQuery,
  paging?: Paging,
  entity?: DatabaseResolvedEntityReference,
) {
  const database = createMockDatabase();
  return generateGetChangelogEventsQuery(
    database,
    query ?? {},
    resolvePaging(paging),
    entity ?? null,
  );
}

describe('generateGetChangelogEventsQuery', () => {
  test('default', () => {
    expect(getChangelogEventsQuery().valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id ORDER BY e.id LIMIT ?1",
        "values": [
          26,
        ],
      }
    `);
  });

  test('reverse', () => {
    expect(getChangelogEventsQuery({ reverse: true }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id ORDER BY e.id DESC LIMIT ?1",
        "values": [
          26,
        ],
      }
    `);
  });

  test('createdBy', () => {
    expect(getChangelogEventsQuery({ createdBy: '1-2-3' }).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE e.created_by = (SELECT id FROM subjects WHERE uuid = ?1) ORDER BY e.id LIMIT ?2",
        "values": [
          "1-2-3",
          26,
        ],
      }
    `);
  });

  test('entity', () => {
    expect(
      getChangelogEventsQuery({ entity: { id: '1-2-3' } }, undefined, {
        entityInternalId: 123,
      }).valueOrThrow(),
    ).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id JOIN event_entity_versions eev ON eev.events_id = e.id JOIN entity_versions ev ON eev.entity_versions_id = ev.id WHERE ev.entities_id = ?1 ORDER BY e.id LIMIT ?2",
        "values": [
          123,
          26,
        ],
      }
    `);
  });

  test('types', () => {
    expect(getChangelogEventsQuery({ types: [EventType.updateSchema] }).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE e.type IN (?1) ORDER BY e.id LIMIT ?2",
          "values": [
            "updateSchema",
            26,
          ],
        }
      `);
  });

  test('types and createdBy', () => {
    expect(
      getChangelogEventsQuery({
        types: [EventType.updateSchema],
        createdBy: '1-2-3',
      }).valueOrThrow(),
    ).toMatchInlineSnapshot(`
      {
        "text": "SELECT e.id, e.type, e.created_at, s.uuid, sv.version FROM events e JOIN subjects s ON e.created_by = s.id LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id WHERE e.created_by = (SELECT id FROM subjects WHERE uuid = ?1) AND e.type IN (?2) ORDER BY e.id LIMIT ?3",
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
    expect(generateGetChangelogTotalCountQuery({}, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "text": "SELECT COUNT(*) AS count FROM events e",
        "values": [],
      }
    `);
  });

  test('reverse', () => {
    expect(generateGetChangelogTotalCountQuery({ reverse: true }, null).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "text": "SELECT COUNT(*) AS count FROM events e",
          "values": [],
        }
      `);
  });

  test('createdBy', () => {
    expect(generateGetChangelogTotalCountQuery({ createdBy: '1-2-3' }, null).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "text": "SELECT COUNT(*) AS count FROM events e WHERE e.created_by = (SELECT id FROM subjects WHERE uuid = ?1)",
          "values": [
            "1-2-3",
          ],
        }
      `);
  });

  test('entity', () => {
    expect(
      generateGetChangelogTotalCountQuery(
        { entity: { id: '1-2-3' } },
        { entityInternalId: 123 },
      ).valueOrThrow(),
    ).toMatchInlineSnapshot(`
      {
        "text": "SELECT COUNT(*) AS count FROM events e JOIN event_entity_versions eev ON eev.events_id = e.id JOIN entity_versions ev ON eev.entity_versions_id = ev.id WHERE ev.entities_id = ?1",
        "values": [
          123,
        ],
      }
    `);
  });

  test('types', () => {
    expect(
      generateGetChangelogTotalCountQuery({ types: [EventType.updateSchema] }, null).valueOrThrow(),
    ).toMatchInlineSnapshot(`
      {
        "text": "SELECT COUNT(*) AS count FROM events e WHERE e.type IN (?1)",
        "values": [
          "updateSchema",
        ],
      }
    `);
  });

  test('types and createdBy', () => {
    expect(
      generateGetChangelogTotalCountQuery(
        { types: [EventType.updateSchema], createdBy: '1-2-3' },
        null,
      ).valueOrThrow(),
    ).toMatchInlineSnapshot(`
      {
        "text": "SELECT COUNT(*) AS count FROM events e WHERE e.created_by = (SELECT id FROM subjects WHERE uuid = ?1) AND e.type IN (?2)",
        "values": [
          "1-2-3",
          "updateSchema",
        ],
      }
    `);
  });
});
