import { toOpaqueCursor } from './Connection';
import { resolvePaging } from './Paging';
import { searchAdminEntitiesQuery } from './QueryGenerator';

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    expect(searchAdminEntitiesQuery(resolvePaging())).toMatchInlineSnapshot(`
      Object {
        "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
        "values": Array [
          26,
        ],
      }
    `);
  });

  test('first 10', () => {
    expect(searchAdminEntitiesQuery(resolvePaging({ first: 10 }))).toMatchInlineSnapshot(`
      Object {
        "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
        "values": Array [
          11,
        ],
      }
    `);
  });

  test('first 10 after', () => {
    expect(searchAdminEntitiesQuery(resolvePaging({ first: 10, after: toOpaqueCursor(999) })))
      .toMatchInlineSnapshot(`
      Object {
        "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 ORDER BY e.id LIMIT $2",
        "values": Array [
          999,
          11,
        ],
      }
    `);
  });

  test('last 10', () => {
    expect(searchAdminEntitiesQuery(resolvePaging({ last: 10 }))).toMatchInlineSnapshot(`
      Object {
        "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id DESC LIMIT $1",
        "values": Array [
          11,
        ],
      }
    `);
  });

  test('last 10 before', () => {
    expect(searchAdminEntitiesQuery(resolvePaging({ last: 10, before: toOpaqueCursor(456) })))
      .toMatchInlineSnapshot(`
      Object {
        "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND e.id < $1 ORDER BY e.id DESC LIMIT $2",
        "values": Array [
          456,
          11,
        ],
      }
    `);
  });
});
