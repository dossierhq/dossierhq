import { CoreTestUtils, ErrorType } from '@datadata/core';
import type { Instance, SessionContext } from '.';
import { toOpaqueCursor } from './Connection';
import { searchAdminEntitiesQuery, totalAdminEntitiesQuery } from './QueryGenerator';
import { createTestInstance, ensureSessionContext, updateSchema } from './ServerTestUtils';

const { expectErrorResult } = CoreTestUtils;

let instance: Instance;
let context: SessionContext;

beforeAll(async () => {
  instance = await createTestInstance();
  context = await ensureSessionContext(instance, 'test', 'query-generator');
  await updateSchema(context, {
    entityTypes: [
      { name: 'QueryGeneratorFoo', fields: [] },
      { name: 'QueryGeneratorBar', fields: [] },
    ],
  });
});
afterAll(async () => {
  await instance.shutdown();
});

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    expect(searchAdminEntitiesQuery(context, undefined, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
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
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    expect(
      searchAdminEntitiesQuery(context, undefined, { first: 10, after: toOpaqueCursor('int', 999) })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 ORDER BY e.id LIMIT $2",
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
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id DESC LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    expect(
      searchAdminEntitiesQuery(context, undefined, { last: 10, before: toOpaqueCursor('int', 456) })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id < $1 ORDER BY e.id DESC LIMIT $2",
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
        after: toOpaqueCursor('int', 123),
        before: toOpaqueCursor('int', 456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id LIMIT $3",
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
        after: toOpaqueCursor('int', 123),
        before: toOpaqueCursor('int', 456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    expect(searchAdminEntitiesQuery(context, { entityTypes: [] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('query one entity type', () => {
    expect(searchAdminEntitiesQuery(context, { entityTypes: ['QueryGeneratorFoo'] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query two entity types', () => {
    expect(
      searchAdminEntitiesQuery(
        context,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query two entity types, first and after', () => {
    expect(
      searchAdminEntitiesQuery(
        context,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        { first: 10, after: toOpaqueCursor('int', 543) }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) AND e.id > $2 ORDER BY e.id LIMIT $3",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            543,
            11,
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(
      searchAdminEntitiesQuery(
        context,
        { referencing: '37b48706-803e-4227-a51e-8208db12d949' },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "37b48706-803e-4227-a51e-8208db12d949",
            26,
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      searchAdminEntitiesQuery(
        context,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          referencing: '37b48706-803e-4227-a51e-8208db12d949',
        },
        { first: 10, after: toOpaqueCursor('int', 123) }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "id",
          "cursorType": "int",
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 AND e.id > $3 ORDER BY e.id LIMIT $4",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            "37b48706-803e-4227-a51e-8208db12d949",
            123,
            11,
          ],
        },
      }
    `);
  });

  test('order by name', () => {
    expect(
      searchAdminEntitiesQuery(
        context,
        {
          order: '_name',
        },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorName": "name",
          "cursorType": "string",
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.name LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const result = searchAdminEntitiesQuery(context, { entityTypes: ['Invalid'] }, undefined);
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('totalAdminEntitiesQuery()', () => {
  test('no query', () => {
    expect(totalAdminEntitiesQuery(context, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e",
          "values": Array [],
        },
      }
    `);
  });

  test('no entity type => all', () => {
    expect(totalAdminEntitiesQuery(context, { entityTypes: [] })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e",
          "values": Array [],
        },
      }
    `);
  });

  test('one entity type', () => {
    expect(totalAdminEntitiesQuery(context, { entityTypes: ['QueryGeneratorFoo'] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.type = ANY($1)",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
            ],
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(
      totalAdminEntitiesQuery(context, { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.type = ANY($1)",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(
      totalAdminEntitiesQuery(context, { referencing: '37b48706-803e-4227-a51e-8208db12d949' })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $1",
          "values": Array [
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      totalAdminEntitiesQuery(context, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.type = ANY($1) AND e.latest_draft_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });
});
