import type { AdminClient } from '@datadata/core';
import { CoreTestUtils, FieldType, notOk, ok, RichTextBlockType } from '@datadata/core';
import { createServerAdminClient, ServerTestUtils } from '@datadata/server';
import type { Server, SessionContext } from '@datadata/server';
import { graphql, printError } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

const { expectOkResult } = CoreTestUtils;
const { createTestServer, ensureSessionContext, updateSchema } = ServerTestUtils;

let server: Server;
let context: SessionContext;
let adminClient: AdminClient;
let schema: GraphQLSchema;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'query');
  adminClient = createServerAdminClient({ resolveContext: () => Promise.resolve(context) });
  await updateSchema(context, {
    entityTypes: [
      {
        name: 'QueryFoo',
        fields: [
          { name: 'title', type: FieldType.String, isName: true },
          { name: 'summary', type: FieldType.String },
          { name: 'tags', type: FieldType.String, list: true },
          { name: 'body', type: FieldType.RichText },
          { name: 'location', type: FieldType.Location },
          { name: 'locations', type: FieldType.Location, list: true },
          { name: 'bar', type: FieldType.EntityType, entityTypes: ['QueryBar'] },
          { name: 'bars', type: FieldType.EntityType, entityTypes: ['QueryBar'], list: true },
          { name: 'stringedBar', type: FieldType.ValueType, valueTypes: ['QueryStringedBar'] },
        ],
      },
      { name: 'QueryBar', fields: [{ name: 'title', type: FieldType.String }] },
    ],
    valueTypes: [
      {
        name: 'QueryStringedBar',
        fields: [
          { name: 'text', type: FieldType.String },
          { name: 'bar', type: FieldType.EntityType, entityTypes: ['QueryBar'] },
        ],
      },
    ],
  });
  schema = new GraphQLSchemaGenerator(context.server.getSchema()).buildSchema();
});

afterAll(async () => {
  await server?.shutdown();
});

describe('node()', () => {
  test('Query all fields of created entity', async () => {
    const createResult = await adminClient.createEntity({
      _type: 'QueryFoo',
      _name: 'Howdy name',
      title: 'Howdy title',
      summary: 'Howdy summary',
      location: { lat: 55.60498, lng: 13.003822 },
      locations: [
        { lat: 55.60498, lng: 13.003822 },
        { lat: 56.381561, lng: 13.99286 },
      ],
      tags: ['one', 'two', 'three'],
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version: 0 }]));

      const result = await graphql(
        schema,
        `
          query Entity($id: ID!) {
            node(id: $id) {
              __typename
              id
              ... on QueryFoo {
                _name
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
          node: {
            __typename: 'QueryFoo',
            id,
            _name: createResult.value._name,
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
    const createResult = await adminClient.createEntity({
      _type: 'QueryFoo',
      _name: 'Howdy name',
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version: 0 }]));

      const result = await graphql(
        schema,
        `
          query Entity($id: ID!) {
            node(id: $id) {
              __typename
              id
              ... on QueryFoo {
                _name
                title
                summary
                bar {
                  id
                }
                bars {
                  id
                }
                tags
                location {
                  lat
                  lng
                }
                locations {
                  lat
                  lng
                }
                stringedBar {
                  __typename
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
          node: {
            __typename: 'QueryFoo',
            id,
            _name: createResult.value._name,
            title: null,
            summary: null,
            bar: null,
            bars: null,
            tags: null,
            location: null,
            locations: null,
            stringedBar: null,
          },
        },
      });
    }
  });

  test('Query rich text', async () => {
    const createFooResult = await adminClient.createEntity({
      _type: 'QueryFoo',
      _name: 'Foo name',
      body: { blocks: [{ type: RichTextBlockType.paragraph, data: { text: 'Hello world' } }] },
    });
    if (expectOkResult(createFooResult)) {
      const fooId = createFooResult.value.id;

      expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

      const result = await graphql(
        schema,
        `
          query Entity($id: ID!) {
            node(id: $id) {
              __typename
              id
              ... on QueryFoo {
                _name
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
          node: {
            __typename: 'QueryFoo',
            id: fooId,
            _name: createFooResult.value._name,
            body: {
              blocksJson: '[{"type":"paragraph","data":{"text":"Hello world"}}]',
              entities: [],
            },
          },
        },
      });
    }
  });

  test('Query rich text with reference', async () => {
    const createBarResult = await adminClient.createEntity({
      _type: 'QueryBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const { id: barId, _name: barName } = createBarResult.value;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        _type: 'QueryFoo',
        _name: 'Foo name',
        body: {
          blocks: [
            { type: RichTextBlockType.entity, data: { id: barId } },
            { type: RichTextBlockType.paragraph, data: { text: 'Hello world' } },
          ],
        },
      });
      if (expectOkResult(createFooResult)) {
        const { id: fooId } = createFooResult.value;

        expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on QueryFoo {
                  _name
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
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              _name: createFooResult.value._name,
              body: {
                blocksJson: `[{"type":"entity","data":{"id":"${barId}"}},{"type":"paragraph","data":{"text":"Hello world"}}]`,
                entities: [{ id: barId, _name: barName }],
              },
            },
          },
        });
      }
    }
  });

  test('Query referenced entity', async () => {
    const createBarResult = await adminClient.createEntity({
      _type: 'QueryBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        _type: 'QueryFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bar: { id: barId },
      });
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

        expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on QueryFoo {
                  _name
                  title
                  bar {
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
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              _name: createFooResult.value._name,
              title: 'Foo title',
              bar: {
                __typename: 'QueryBar',
                _name: createBarResult.value._name,
                id: barId,
                title: 'Bar title',
              },
            },
          },
        });
      }
    }
  });

  test('Query referenced entity list', async () => {
    const createBar1Result = await adminClient.createEntity({
      _type: 'QueryBar',
      _name: 'Bar 1 name',
      title: 'Bar 1 title',
    });
    const createBar2Result = await adminClient.createEntity({
      _type: 'QueryBar',
      _name: 'Bar 2 name',
      title: 'Bar 2 title',
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const bar1Id = createBar1Result.value.id;
      const bar2Id = createBar2Result.value.id;

      expectOkResult(
        await adminClient.publishEntities([
          { id: bar1Id, version: 0 },
          { id: bar2Id, version: 0 },
        ])
      );

      const createFooResult = await adminClient.createEntity({
        _type: 'QueryFoo',
        _name: 'Foo name',
        title: 'Foo title',
        bars: [{ id: bar1Id }, { id: bar2Id }],
      });
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

        expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on QueryFoo {
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
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              _name: createFooResult.value._name,
              title: 'Foo title',
              bars: [
                {
                  __typename: 'QueryBar',
                  _name: createBar1Result.value._name,
                  id: bar1Id,
                  title: 'Bar 1 title',
                },
                {
                  __typename: 'QueryBar',
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
    const createBarResult = await adminClient.createEntity({
      _type: 'QueryBar',
      _name: 'Bar name',
      title: 'Bar title',
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        _type: 'QueryFoo',
        _name: 'Foo name',
        title: 'Foo title',
        stringedBar: { _type: 'QueryStringedBar', text: 'Value text', bar: { id: barId } },
      });
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

        expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

        const result = await graphql(
          schema,
          `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on QueryFoo {
                  _name
                  title
                  stringedBar {
                    __typename
                    _type
                    text
                    bar {
                      __typename
                      id
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
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              _name: createFooResult.value._name,
              title: 'Foo title',
              stringedBar: {
                __typename: 'QueryStringedBar',
                _type: 'QueryStringedBar',
                text: 'Value text',
                bar: {
                  __typename: 'QueryBar',
                  _name: createBarResult.value._name,
                  id: barId,
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
        query Entity($id: ID!) {
          node(id: $id) {
            id
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' }
    );
    expect(result.data).toEqual({
      node: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotFound: No such entity

GraphQL request:3:11
2 |         query Entity($id: ID!) {
3 |           node(id: $id) {
  |           ^
4 |             id`,
    ]);
  });

  test('Error: No session', async () => {
    const result = await graphql(
      schema,
      `
        query Entity($id: ID!) {
          node(id: $id) {
            id
          }
        }
      `,
      undefined,
      { context: notOk.NotAuthenticated('No session') },
      { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' }
    );
    expect(result.data).toEqual({
      node: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotAuthenticated: No session

GraphQL request:3:11
2 |         query Entity($id: ID!) {
3 |           node(id: $id) {
  |           ^
4 |             id`,
    ]);
  });
});

describe('nodes()', () => {
  test('Query 2 entities', async () => {
    const createFoo1Result = await adminClient.createEntity({
      _type: 'QueryFoo',
      _name: 'Howdy name 1',
    });
    const createFoo2Result = await adminClient.createEntity({
      _type: 'QueryFoo',
      _name: 'Howdy name 2',
    });
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const { id: foo1Id, _name: foo1Name } = createFoo1Result.value;
      const { id: foo2Id, _name: foo2Name } = createFoo2Result.value;

      expectOkResult(
        await adminClient.publishEntities([
          { id: foo1Id, version: 0 },
          { id: foo2Id, version: 0 },
        ])
      );

      const result = await graphql(
        schema,
        `
          query Entities($ids: [ID!]!) {
            nodes(ids: $ids) {
              __typename
              id
              ... on QueryFoo {
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
          nodes: [
            {
              __typename: 'QueryFoo',
              id: foo1Id,
              _name: foo1Name,
            },
            {
              __typename: 'QueryFoo',
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
          nodes(ids: $ids) {
            id
          }
        }
      `,
      undefined,
      { context: ok(context) },
      { ids: ['6043cb20-50dc-43d9-8d55-fc9b892b30af'] }
    );
    expect(result.data).toEqual({
      nodes: [null],
    });
    expect(result.errors).toBeFalsy();
  });
});
