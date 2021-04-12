import type {
  AdminEntity,
  AdminQuery,
  BoundingBox,
  Connection,
  Edge,
  ErrorType,
  Paging,
} from '@datadata/core';
import { CoreTestUtils, FieldType, notOk, ok, RichTextBlockType } from '@datadata/core';
import type { SessionContext, Server } from '@datadata/server';
import { EntityAdmin, ServerTestUtils } from '@datadata/server';
import { graphql, printError } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

const { expectOkResult } = CoreTestUtils;
const { createTestServer, ensureSessionContext, updateSchema } = ServerTestUtils;

let server: Server;
let context: SessionContext;
let schema: GraphQLSchema;
let entitiesOfTypeQueryAdminOnlyEditBefore: AdminEntity[];

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'query');
  await updateSchema(context, {
    entityTypes: [
      {
        name: 'QueryAdminFoo',
        fields: [
          { name: 'title', type: FieldType.String, isName: true },
          { name: 'summary', type: FieldType.String },
          { name: 'tags', type: FieldType.String, list: true },
          { name: 'body', type: FieldType.RichText },
          { name: 'location', type: FieldType.Location },
          { name: 'locations', type: FieldType.Location, list: true },
          { name: 'bar', type: FieldType.EntityType, entityTypes: ['QueryAdminBar'] },
          {
            name: 'bars',
            type: FieldType.EntityType,
            list: true,
            entityTypes: ['QueryAdminBar'],
          },
          { name: 'stringedBar', type: FieldType.ValueType, valueTypes: ['QueryAdminStringedBar'] },
        ],
      },
      { name: 'QueryAdminBar', fields: [{ name: 'title', type: FieldType.String }] },
      { name: 'QueryAdminOnlyEditBefore', fields: [{ name: 'message', type: FieldType.String }] },
    ],
    valueTypes: [
      {
        name: 'QueryAdminStringedBar',
        fields: [
          { name: 'text', type: FieldType.String },
          { name: 'bar', type: FieldType.EntityType, entityTypes: ['QueryAdminBar'] },
        ],
      },
    ],
  });
  schema = new GraphQLSchemaGenerator(context.server.getSchema()).buildSchema();

  await ensureTestEntitiesExist(context);
  entitiesOfTypeQueryAdminOnlyEditBefore = await getEntitiesForAdminOnlyEditBefore(context);
});

afterAll(async () => {
  await server?.shutdown();
});

async function ensureTestEntitiesExist(context: SessionContext) {
  const requestedCount = 50;
  const entitiesOfTypeCount = await EntityAdmin.getTotalCount(context, {
    entityTypes: ['QueryAdminOnlyEditBefore'],
  });

  if (expectOkResult(entitiesOfTypeCount)) {
    for (let count = entitiesOfTypeCount.value; count < requestedCount; count += 1) {
      const random = String(Math.random()).slice(2);
      const createResult = await EntityAdmin.createEntity(context, {
        _type: 'QueryAdminOnlyEditBefore',
        _name: random,
        message: `Hey ${random}`,
      });
      createResult.throwIfError();
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(context: SessionContext) {
  const entities: AdminEntity[] = [];
  await visitAllEntityPages(
    context,
    { entityTypes: ['QueryAdminOnlyEditBefore'] },
    (connection) => {
      for (const edge of connection.edges) {
        if (edge.node.isOk()) {
          entities.push(edge.node.value);
        }
      }
    }
  );
  return entities;
}

async function visitAllEntityPages(
  context: SessionContext,
  query: AdminQuery,
  visitor: (connection: Connection<Edge<AdminEntity, ErrorType>>) => void
) {
  const paging: Paging = {};
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await EntityAdmin.searchEntities(context, query, paging);
    if (result.isError()) {
      throw result.toError();
    }
    if (result.value === null) {
      return;
    }

    visitor(result.value);
    paging.after = result.value.pageInfo.endCursor;
    if (!result.value.pageInfo.hasNextPage) {
      return;
    }
  }
}

async function createBarWithFooReferences(context: SessionContext, fooCount: number) {
  const createBarResult = await EntityAdmin.createEntity(context, {
    _type: 'QueryAdminBar',
    _name: 'Bar',
    title: 'Bar',
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const { id: barId } = createBarResult.value;

  const fooEntities: AdminEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Foo: ' + i,
      bar: { id: barId },
    });
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value);
    }
  }

  return { barId, fooEntities };
}

/** Random bounding box (which doesn't wrap 180/-180 longitude) */
function randomBoundingBox(heightLat = 1.0, widthLng = 1.0): BoundingBox {
  function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  const minLat = randomInRange(-90, 90 - heightLat);
  const minLng = randomInRange(-180, 180 - widthLng);
  const maxLat = minLat + heightLat;
  const maxLng = minLng + widthLng;
  return { minLat, maxLat, minLng, maxLng };
}

describe('adminEntity()', () => {
  test('Query all fields of created entity', async () => {
    const createResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Howdy name',
      title: 'Howdy title',
      summary: 'Howdy summary',
      tags: ['one', 'two', 'three'],
      location: { lat: 55.60498, lng: 13.003822 },
      locations: [
        { lat: 55.60498, lng: 13.003822 },
        { lat: 56.381561, lng: 13.99286 },
      ],
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      const result = await graphql(
        schema,
        `
          query AdminEntity($id: ID!) {
            adminEntity(id: $id) {
              __typename
              id
              _type
              _name
              _version
              _deleted
              ... on AdminQueryAdminFoo {
                title
                summary
                tags
                location {
                  lat
                  lng
                }
                locations {
                  lat
                  lng
                }
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id }
      );
      expect(result).toEqual({
        data: {
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id,
            _version: 0,
            _type: 'QueryAdminFoo',
            _name: name,
            _deleted: false,
            title: 'Howdy title',
            summary: 'Howdy summary',
            tags: ['one', 'two', 'three'],
            location: { lat: 55.60498, lng: 13.003822 },
            locations: [
              { lat: 55.60498, lng: 13.003822 },
              { lat: 56.381561, lng: 13.99286 },
            ],
          },
        },
      });
    }
  });

  test('Query null fields of created entity', async () => {
    const createResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Howdy name',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      const result = await graphql(
        schema,
        `
          query AdminEntity($id: ID!) {
            adminEntity(id: $id) {
              __typename
              id
              _type
              _name
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
                tags
                bar {
                  id
                }
                bars {
                  id
                }
                location {
                  lat
                  lng
                }
                locations {
                  lat
                  lng
                }
                stringedBar {
                  _type
                }
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id }
      );
      expect(result).toEqual({
        data: {
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id,
            _type: 'QueryAdminFoo',
            _name: name,
            _version: 0,
            title: null,
            summary: null,
            tags: null,
            bar: null,
            bars: null,
            location: null,
            locations: null,
            stringedBar: null,
          },
        },
      });
    }
  });

  test('Query different versions of same entity created entity', async () => {
    const createResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'First name',
      title: 'First title',
      summary: 'First summary',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      expectOkResult(
        await EntityAdmin.updateEntity(context, {
          id,
          title: 'Second title',
          summary: 'Second summary',
        })
      );

      const result = await graphql(
        schema,
        `
          query FourVersionsOfAdminEntity(
            $id: ID!
            $version1: Int!
            $version2: Int!
            $version3: Int!
            $version4: Int
          ) {
            first: adminEntity(id: $id, version: $version1) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
            second: adminEntity(id: $id, version: $version2) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
            third: adminEntity(id: $id, version: $version3) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
            fourth: adminEntity(id: $id, version: $version4) {
              id
              _version
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id, version1: 0, version2: 1, version3: 100, version4: null }
      );
      expect(result.data).toEqual({
        first: {
          id,
          _version: 0,
          title: 'First title',
          summary: 'First summary',
        },
        second: {
          id,
          _version: 1,
          title: 'Second title',
          summary: 'Second summary',
        },
        third: null, // invalid version
        fourth: {
          //default to max
          id,
          _version: 1,
          title: 'Second title',
          summary: 'Second summary',
        },
      });
      const errorStrings = result.errors?.map(printError);
      expect(errorStrings).toMatchInlineSnapshot(`
        Array [
          "NotFound: No such entity or version

        GraphQL request:25:13
        24 |             }
        25 |             third: adminEntity(id: $id, version: $version3) {
           |             ^
        26 |               id",
        ]
      `);
    }
  });

  test('Query deleted entity', async () => {
    const createResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'First name',
      title: 'First title',
      summary: 'First summary',
    });
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;

      expectOkResult(await EntityAdmin.deleteEntity(context, id));

      const result = await graphql(
        schema,
        `
          query TwoVersionsOfAdminEntity($id: ID!, $version1: Int!, $version2: Int!) {
            first: adminEntity(id: $id, version: $version1) {
              id
              _version
              _deleted
              _name
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
            second: adminEntity(id: $id, version: $version2) {
              id
              _version
              _deleted
              _name
              ... on AdminQueryAdminFoo {
                title
                summary
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id, version1: 0, version2: 1 }
      );
      expect(result.data).toEqual({
        first: {
          id,
          _version: 0,
          _deleted: false,
          _name: name,
          title: 'First title',
          summary: 'First summary',
        },
        second: {
          id,
          _version: 1,
          _deleted: true,
          _name: name,
          title: null,
          summary: null,
        },
      });
    }
  });

  test('Query rich text field', async () => {
    const createFooResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Foo name',
      body: { blocks: [{ type: RichTextBlockType.paragraph, data: { text: 'Hello foo world' } }] },
    });
    if (expectOkResult(createFooResult)) {
      const fooId = createFooResult.value.id;

      const result = await graphql(
        schema,
        `
          query Entity($id: ID!) {
            adminEntity(id: $id) {
              __typename
              id
              _type
              _name
              _version
              ... on AdminQueryAdminFoo {
                body {
                  blocksJson
                  entities {
                    id
                  }
                }
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id: fooId }
      );
      expect(result).toEqual({
        data: {
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id: fooId,
            _type: 'QueryAdminFoo',
            _name: createFooResult.value._name,
            _version: 0,
            body: {
              blocksJson: '[{"type":"paragraph","data":{"text":"Hello foo world"}}]',
              entities: [],
            },
          },
        },
      });
    }
  });

  test('Query rich text with references', async () => {
    const createBar1Result = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminBar',
      _name: 'Bar name 1',
      title: 'Bar title 1',
    });
    const createBar2Result = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminBar',
      _name: 'Bar name 2',
      title: 'Bar title 2',
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id, _name: bar1Name } = createBar1Result.value;
      const { id: bar2Id, _name: bar2Name } = createBar2Result.value;

      const createFooResult = await EntityAdmin.createEntity(context, {
        _type: 'QueryAdminFoo',
        _name: 'Foo name',
        body: {
          blocks: [
            { type: RichTextBlockType.entity, data: { id: bar1Id } },
            {
              type: RichTextBlockType.valueItem,
              data: { _type: 'QueryAdminStringedBar', text: 'Hello', bar: { id: bar2Id } },
            },
          ],
        },
      });
      if (expectOkResult(createFooResult)) {
        const { id: fooId } = createFooResult.value;

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                _type
                _name
                _version
                ... on AdminQueryAdminFoo {
                  body {
                    blocksJson
                    entities {
                      id
                      _name
                    }
                  }
                }
              }
            }
          `,
          undefined,
          { context: ok(context) },
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              _type: 'QueryAdminFoo',
              _name: createFooResult.value._name,
              _version: 0,
              body: {
                blocksJson: `[{"type":"entity","data":{"id":"${bar1Id}"}},{"type":"valueItem","data":{"_type":"QueryAdminStringedBar","bar":{"id":"${bar2Id}"},"text":"Hello"}}]`,
                entities: [
                  { id: bar1Id, _name: bar1Name },
                  { id: bar2Id, _name: bar2Name },
                ],
              },
            },
          },
        });
      }
    }
  });

  test('Query referenced entity', async () => {
    const createBarResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await EntityAdmin.createEntity(context, {
        _type: 'QueryAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bar: { id: barId },
      });
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                _type
                _name
                _version
                ... on AdminQueryAdminFoo {
                  title
                  bar {
                    __typename
                    id
                    _type
                    _name
                    title
                  }
                }
              }
            }
          `,
          undefined,
          { context: ok(context) },
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              _type: 'QueryAdminFoo',
              _name: createFooResult.value._name,
              _version: 0,
              title: 'Foo title',
              bar: {
                __typename: 'AdminQueryAdminBar',
                id: barId,
                _type: 'QueryAdminBar',
                _name: createBarResult.value._name,
                title: 'Bar title',
              },
            },
          },
        });
      }
    }
  });

  test('Query referenced entity list', async () => {
    const createBar1Result = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminBar',
      _name: 'Bar 1 name',
      title: 'Bar 1 title',
    });
    const createBar2Result = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminBar',
      _name: 'Bar 2 name',
      title: 'Bar 2 title',
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const bar1Id = createBar1Result.value.id;
      const bar2Id = createBar2Result.value.id;

      const createFooResult = await EntityAdmin.createEntity(context, {
        _type: 'QueryAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bars: [{ id: bar1Id }, { id: bar2Id }],
      });
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                ... on AdminQueryAdminFoo {
                  _name
                  title
                  bars {
                    __typename
                    id
                    _name
                    title
                  }
                }
              }
            }
          `,
          undefined,
          { context: ok(context) },
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              _name: createFooResult.value._name,
              title: 'Foo title',
              bars: [
                {
                  __typename: 'AdminQueryAdminBar',
                  _name: createBar1Result.value._name,
                  id: bar1Id,
                  title: 'Bar 1 title',
                },
                {
                  __typename: 'AdminQueryAdminBar',
                  _name: createBar2Result.value._name,
                  id: bar2Id,
                  title: 'Bar 2 title',
                },
              ],
            },
          },
        });
      }
    }
  });

  test('Query value type', async () => {
    const createBarResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await EntityAdmin.createEntity(context, {
        _type: 'QueryAdminFoo',
        _name: 'Foo name',
        title: 'Foo title',
        stringedBar: {
          _type: 'QueryAdminStringedBar',
          text: 'Stringed text',
          bar: { id: barId },
        },
      });
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                _type
                _name
                _version
                ... on AdminQueryAdminFoo {
                  title
                  stringedBar {
                    __typename
                    _type
                    text
                    bar {
                      __typename
                      id
                      _type
                      _name
                      title
                    }
                  }
                }
              }
            }
          `,
          undefined,
          { context: ok(context) },
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              _type: 'QueryAdminFoo',
              _name: createFooResult.value._name,
              _version: 0,
              title: 'Foo title',
              stringedBar: {
                __typename: 'AdminQueryAdminStringedBar',
                _type: 'QueryAdminStringedBar',
                text: 'Stringed text',
                bar: {
                  __typename: 'AdminQueryAdminBar',
                  id: barId,
                  _type: 'QueryAdminBar',
                  _name: createBarResult.value._name,
                  title: 'Bar title',
                },
              },
            },
          },
        });
      }
    }
  });

  test('Error: Query invalid id', async () => {
    const result = await graphql(
      schema,
      `
        query AdminEntity($id: ID!) {
          adminEntity(id: $id) {
            id
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' }
    );
    expect(result.data).toEqual({
      adminEntity: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotFound: No such entity

GraphQL request:3:11
2 |         query AdminEntity($id: ID!) {
3 |           adminEntity(id: $id) {
  |           ^
4 |             id`,
    ]);
  });

  test('Error: No session', async () => {
    const result = await graphql(
      schema,
      `
        query AdminEntity($id: ID!) {
          adminEntity(id: $id) {
            id
          }
        }
      `,
      undefined,
      { context: notOk.NotAuthenticated('No session') },
      { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' }
    );
    expect(result.data).toEqual({
      adminEntity: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotAuthenticated: No session

GraphQL request:3:11
2 |         query AdminEntity($id: ID!) {
3 |           adminEntity(id: $id) {
  |           ^
4 |             id`,
    ]);
  });
});

describe('adminEntities()', () => {
  test('Query 2 entities', async () => {
    const createFoo1Result = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Howdy name 1',
    });
    const createFoo2Result = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Howdy name 2',
    });
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const { id: foo1Id, _name: foo1Name } = createFoo1Result.value;
      const { id: foo2Id, _name: foo2Name } = createFoo2Result.value;

      const result = await graphql(
        schema,
        `
          query Entities($ids: [ID!]!) {
            adminEntities(ids: $ids) {
              __typename
              _type
              id
              ... on AdminQueryAdminFoo {
                _name
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { ids: [foo1Id, foo2Id] }
      );
      expect(result).toEqual({
        data: {
          adminEntities: [
            {
              __typename: 'AdminQueryAdminFoo',
              _type: 'QueryAdminFoo',
              id: foo1Id,
              _name: foo1Name,
            },
            {
              __typename: 'AdminQueryAdminFoo',
              _type: 'QueryAdminFoo',
              id: foo2Id,
              _name: foo2Name,
            },
          ],
        },
      });
    }
  });

  test('Error: Query invalid id', async () => {
    const result = await graphql(
      schema,
      `
        query Entities($ids: [ID!]!) {
          adminEntities(ids: $ids) {
            id
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { ids: ['6043cb20-50dc-43d9-8d55-fc9b892b30af'] }
    );
    expect(result.data).toEqual({
      adminEntities: [null],
    });
    expect(result.errors).toBeFalsy();
  });
});

describe('searchAdminEntities()', () => {
  test('Default => 25', async () => {
    const result = await graphql(
      schema,
      `
        {
          adminSearchEntities(query: { entityTypes: [QueryAdminOnlyEditBefore] }) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.slice(0, 25).map((x) => ({ node: { id: x.id } }))
    );
    expect(result.data?.adminSearchEntities.totalCount).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.length
    );
  });

  test('Default => 25, filter type as argument', async () => {
    const result = await graphql(
      schema,
      `
        query Search($entityTypes: [EntityType]) {
          adminSearchEntities(query: { entityTypes: $entityTypes }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { entityTypes: ['QueryAdminOnlyEditBefore'] }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.slice(0, 25).map((x) => ({ node: { id: x.id } }))
    );
  });

  test('first 10', async () => {
    const result = await graphql(
      schema,
      `
        {
          adminSearchEntities(query: { entityTypes: [QueryAdminOnlyEditBefore] }, first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.slice(0, 10).map((x) => ({ node: { id: x.id } }))
    );
  });

  test('last 10', async () => {
    const result = await graphql(
      schema,
      `
        {
          adminSearchEntities(query: { entityTypes: [QueryAdminOnlyEditBefore] }, last: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBefore.slice(-10).map((x) => ({ node: { id: x.id } }))
    );
  });

  test('last 10, ordered by _name', async () => {
    const result = await graphql(
      schema,
      `
        {
          adminSearchEntities(
            query: { entityTypes: [QueryAdminOnlyEditBefore], order: "_name" }
            last: 10
          ) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      undefined,
      { context: ok(context) }
    );
    expect(result.data?.adminSearchEntities.edges).toEqual(
      [...entitiesOfTypeQueryAdminOnlyEditBefore]
        .sort((a, b) => (a._name < b._name ? -1 : 1))
        .slice(-10)
        .map((x) => ({ node: { id: x.id } }))
    );
  });

  test('Filter based on referencing, one reference', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(context, 1);
    const [fooEntity] = fooEntities;

    const result = await graphql(
      schema,
      `
        query QueryReferencing($id: ID!) {
          adminSearchEntities(query: { referencing: $id }) {
            edges {
              node {
                id
              }
            }
            totalCount
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { id: barId }
    );

    expect(result).toEqual({
      data: {
        adminSearchEntities: {
          totalCount: 1,
          edges: [{ node: { id: fooEntity.id } }],
        },
      },
    });
  });

  test('Filter based on bounding box', async () => {
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const createResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Howdy name',
      location: center,
    });
    if (expectOkResult(createResult)) {
      const { id: fooId } = createResult.value;

      const result = await graphql(
        schema,
        `
          query QueryBoundingBox($boundingBox: BoundingBoxInput!) {
            adminSearchEntities(query: { boundingBox: $boundingBox }) {
              edges {
                node {
                  id
                }
              }
              totalCount
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { boundingBox }
      );

      expect(result?.data?.adminSearchEntities.totalCount).toBeGreaterThanOrEqual(1);

      let fooIdCount = 0;
      for (const edge of result?.data?.adminSearchEntities.edges) {
        if (edge.node.id === fooId) {
          fooIdCount += 1;
        }
      }
      expect(fooIdCount).toBe(1);
    }
  });

  test('Filter based on text', async () => {
    const result = await graphql(
      schema,
      `
        query QueryBoundingBox($text: String!) {
          adminSearchEntities(query: { text: $text }) {
            edges {
              node {
                id
              }
            }
            totalCount
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { text: 'Hey' } // There are at least 50 QueryAdminOnlyEditBefore entities
    );

    expect(result?.data?.adminSearchEntities.totalCount).toBeGreaterThanOrEqual(50);
    expect(result?.data?.adminSearchEntities.edges.length).toBe(25);
  });
});

describe('versionHistory()', () => {
  test('History with edit and unpublished delete', async () => {
    const createResult = await EntityAdmin.createEntity(context, {
      _type: 'QueryAdminFoo',
      _name: 'Foo name',
      title: 'First title',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const updateResult = await EntityAdmin.updateEntity(context, { id, title: 'Updated title' });
      if (expectOkResult(updateResult)) {
        expectOkResult(await EntityAdmin.publishEntity(context, id, updateResult.value._version));
      }

      const deleteResult = await EntityAdmin.deleteEntity(context, id);
      expectOkResult(deleteResult);

      const result = await graphql(
        schema,
        `
          query EntityHistory($id: ID!) {
            adminEntityHistory(id: $id) {
              id
              versions {
                version
                deleted
                published
                createdBy
                createdAt
              }
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id }
      );
      // Remove createdAt since it's tricky to test 🤷‍♂️
      result.data?.adminEntityHistory.versions.forEach(
        (x: { createdAt?: string }) => delete x.createdAt
      );

      expect(result.data).toEqual({
        adminEntityHistory: {
          id,
          versions: [
            { createdBy: context.session.subjectId, deleted: false, published: false, version: 0 },
            { createdBy: context.session.subjectId, deleted: false, published: true, version: 1 },
            { createdBy: context.session.subjectId, deleted: true, published: false, version: 2 },
          ],
        },
      });
    }
  });

  test('Error: invalid id', async () => {
    const result = await graphql(
      schema,
      `
        query EntityHistory($id: ID!) {
          adminEntityHistory(id: $id) {
            id
            versions {
              version
            }
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { id: '6698130c-b56d-48cd-81f5-1f74bedc552e' }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "adminEntityHistory": null,
        },
        "errors": Array [
          [GraphQLError: NotFound: No such entity],
        ],
      }
    `);
  });
});
