import type { Instance, SessionContext } from '.';
import { ErrorType } from './';
import { toOpaqueCursor } from './Connection';
import { searchAdminEntitiesQuery, totalAdminEntitiesQuery } from './QueryGenerator';
import { createTestInstance, ensureSessionContext, expectErrorResult } from './TestUtils';

let instance: Instance;
let context: SessionContext;

beforeAll(async () => {
  instance = await createTestInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'query-generator');
});
afterAll(async () => {
  await instance.shutdown();
});

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    expect(searchAdminEntitiesQuery(context, undefined, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 25,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('first 10', () => {
    expect(searchAdminEntitiesQuery(context, undefined, { first: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 10,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    expect(searchAdminEntitiesQuery(context, undefined, { first: 10, after: toOpaqueCursor(999) }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 10,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            999,
            11,
          ],
        },
      }
    `);
  });

  test('last 10', () => {
    expect(searchAdminEntitiesQuery(context, undefined, { last: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": false,
          "pagingCount": 10,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id DESC LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    expect(searchAdminEntitiesQuery(context, undefined, { last: 10, before: toOpaqueCursor(456) }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": false,
          "pagingCount": 10,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND e.id < $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            456,
            11,
          ],
        },
      }
    `);
  });

  test('first 10 between after and before', () => {
    expect(
      searchAdminEntitiesQuery(context, undefined, {
        first: 10,
        after: toOpaqueCursor(123),
        before: toOpaqueCursor(456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 10,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('last 10 between after and before', () => {
    expect(
      searchAdminEntitiesQuery(context, undefined, {
        last: 10,
        after: toOpaqueCursor(123),
        before: toOpaqueCursor(456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": false,
          "pagingCount": 10,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('filter no entity type, i.e. include all', () => {
    expect(searchAdminEntitiesQuery(context, { entityTypes: [] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 25,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('filter one entity type', () => {
    expect(searchAdminEntitiesQuery(context, { entityTypes: ['EntityAdminFoo'] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 25,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "EntityAdminFoo",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('filter two entity types', () => {
    expect(
      searchAdminEntitiesQuery(
        context,
        { entityTypes: ['EntityAdminFoo', 'EntityAdminBar'] },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 25,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "EntityAdminFoo",
              "EntityAdminBar",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('filter two entity types, first and after', () => {
    expect(
      searchAdminEntitiesQuery(
        context,
        { entityTypes: ['EntityAdminFoo', 'EntityAdminBar'] },
        { first: 10, after: toOpaqueCursor(543) }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "isForwards": true,
          "pagingCount": 10,
          "query": "SELECT e.id, e.uuid, e.type, e.name, ev.data
        FROM entities e, entity_versions ev
        WHERE e.latest_draft_entity_versions_id = ev.id AND type = ANY($1) AND e.id > $2 ORDER BY e.id LIMIT $3",
          "values": Array [
            Array [
              "EntityAdminFoo",
              "EntityAdminBar",
            ],
            543,
            11,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in filter', () => {
    const result = searchAdminEntitiesQuery(context, { entityTypes: ['Invalid'] }, undefined);
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in filter: Invalid');
  });
});

describe('totalAdminEntitiesQuery()', () => {
  test('no filter', () => {
    expect(totalAdminEntitiesQuery(context, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "query": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE true",
          "values": Array [],
        },
      }
    `);
  });

  test('no entity type => all', () => {
    expect(totalAdminEntitiesQuery(context, { entityTypes: [] })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "query": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE true",
          "values": Array [],
        },
      }
    `);
  });

  test('one entity type', () => {
    expect(totalAdminEntitiesQuery(context, { entityTypes: ['EntityAdminFoo'] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "query": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE true AND type = ANY($1)",
          "values": Array [
            Array [
              "EntityAdminFoo",
            ],
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(totalAdminEntitiesQuery(context, { entityTypes: ['EntityAdminFoo', 'EntityAdminBar'] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "query": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE true AND type = ANY($1)",
          "values": Array [
            Array [
              "EntityAdminFoo",
              "EntityAdminBar",
            ],
          ],
        },
      }
    `);
  });
});
