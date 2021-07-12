import type { SchemaSpecification } from '@jonasb/datadata-core';
import { CoreTestUtils, FieldType, notOk, ok, RichTextBlockType } from '@jonasb/datadata-core';
import { graphql, printError } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import type { SessionGraphQLContext } from '..';
import { GraphQLSchemaGenerator } from '..';
import type { TestServerWithSession } from './TestUtils';
import { setUpServerWithSession } from './TestUtils';

const { expectOkResult } = CoreTestUtils;

let server: TestServerWithSession;
let schema: GraphQLSchema;

const schemaSpecification: Partial<SchemaSpecification> = {
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
};

beforeAll(async () => {
  server = await setUpServerWithSession(schemaSpecification);
  schema = new GraphQLSchemaGenerator(server.schema).buildSchema();
});

afterAll(async () => {
  await server?.tearDown();
});

function createContext(): SessionGraphQLContext {
  return {
    schema: ok(server.schema),
    adminClient: ok(server.adminClient),
    publishedClient: ok(server.publishedClient),
  };
}

function createNotAuthenticatedContext(): SessionGraphQLContext {
  return {
    schema: notOk.NotAuthenticated('No schema'),
    adminClient: notOk.NotAuthenticated('No adminClient'),
    publishedClient: notOk.NotAuthenticated('No publishedClient'),
  };
}

describe('node()', () => {
  test('Query all fields of created entity', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Howdy name' },
      fields: {
        title: 'Howdy title',
        summary: 'Howdy summary',
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
        tags: ['one', 'two', 'three'],
      },
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
                info {
                  name
                }
                fields {
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
          }
        `,
        undefined,
        createContext(),
        { id }
      );
      expect(result).toEqual({
        data: {
          node: {
            __typename: 'QueryFoo',
            id,
            info: {
              name: createResult.value.info.name,
            },
            fields: {
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
        },
      });
    }
  });

  test('Query null fields of created entity', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Howdy name' },
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
                info {
                  name
                }
                fields {
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
          }
        `,
        undefined,
        createContext(),
        { id }
      );
      expect(result).toEqual({
        data: {
          node: {
            __typename: 'QueryFoo',
            id,
            info: {
              name: createResult.value.info.name,
            },
            fields: {
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
        },
      });
    }
  });

  test('Query rich text', async () => {
    const { adminClient } = server;
    const createFooResult = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Foo name' },
      fields: {
        body: { blocks: [{ type: RichTextBlockType.paragraph, data: { text: 'Hello world' } }] },
      },
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
                info {
                  name
                }
                fields {
                  body {
                    blocksJson
                    entities {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        undefined,
        createContext(),
        { id: fooId }
      );
      expect(result).toEqual({
        data: {
          node: {
            __typename: 'QueryFoo',
            id: fooId,
            info: { name: createFooResult.value.info.name },
            fields: {
              body: {
                blocksJson: '[{"type":"paragraph","data":{"text":"Hello world"}}]',
                entities: [],
              },
            },
          },
        },
      });
    }
  });

  test('Query rich text with reference', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'QueryBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        id: barId,
        info: { name: barName },
      } = createBarResult.value;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryFoo', name: 'Foo name' },
        fields: {
          body: {
            blocks: [
              { type: RichTextBlockType.entity, data: { id: barId } },
              { type: RichTextBlockType.paragraph, data: { text: 'Hello world' } },
            ],
          },
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
                  info {
                    name
                  }
                  fields {
                    body {
                      blocksJson
                      entities {
                        id
                        info {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          undefined,
          createContext(),
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              info: {
                name: createFooResult.value.info.name,
              },
              fields: {
                body: {
                  blocksJson: `[{"type":"entity","data":{"id":"${barId}"}},{"type":"paragraph","data":{"text":"Hello world"}}]`,
                  entities: [{ id: barId, info: { name: barName } }],
                },
              },
            },
          },
        });
      }
    }
  });

  test('Query referenced entity', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'QueryBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryFoo', name: 'Foo name' },
        fields: { title: 'Foo title', bar: { id: barId } },
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
                  info {
                    name
                  }
                  fields {
                    title
                    bar {
                      __typename
                      id
                      info {
                        name
                      }
                      fields {
                        title
                      }
                    }
                  }
                }
              }
            }
          `,
          undefined,
          createContext(),
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              info: {
                name: createFooResult.value.info.name,
              },
              fields: {
                title: 'Foo title',
                bar: {
                  __typename: 'QueryBar',
                  id: barId,
                  info: {
                    name: createBarResult.value.info.name,
                  },
                  fields: {
                    title: 'Bar title',
                  },
                },
              },
            },
          },
        });
      }
    }
  });

  test('Query referenced entity list', async () => {
    const { adminClient } = server;
    const createBar1Result = await adminClient.createEntity({
      info: { type: 'QueryBar', name: 'Bar 1 name' },
      fields: { title: 'Bar 1 title' },
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'QueryBar', name: 'Bar 2 name' },
      fields: { title: 'Bar 2 title' },
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
        info: { type: 'QueryFoo', name: 'Foo name' },
        fields: { title: 'Foo title', bars: [{ id: bar1Id }, { id: bar2Id }] },
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
                  info {
                    name
                  }
                  fields {
                    title
                    bars {
                      __typename
                      id
                      info {
                        name
                      }
                      fields {
                        title
                      }
                    }
                  }
                }
              }
            }
          `,
          undefined,
          createContext(),
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              info: { name: createFooResult.value.info.name },
              fields: {
                title: 'Foo title',
                bars: [
                  {
                    __typename: 'QueryBar',
                    id: bar1Id,
                    info: { name: createBar1Result.value.info.name },
                    fields: { title: 'Bar 1 title' },
                  },
                  {
                    __typename: 'QueryBar',
                    id: bar2Id,
                    info: { name: createBar2Result.value.info.name },
                    fields: { title: 'Bar 2 title' },
                  },
                ],
              },
            },
          },
        });
      }
    }
  });

  test('Query value type', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'QueryBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          stringedBar: { type: 'QueryStringedBar', text: 'Value text', bar: { id: barId } },
        },
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
                  info {
                    name
                  }
                  fields {
                    title
                    stringedBar {
                      __typename
                      type
                      text
                      bar {
                        __typename
                        id
                        info {
                          name
                        }
                        fields {
                          title
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          undefined,
          createContext(),
          { id: fooId }
        );
        expect(result).toEqual({
          data: {
            node: {
              __typename: 'QueryFoo',
              id: fooId,
              info: { name: createFooResult.value.info.name },
              fields: {
                title: 'Foo title',
                stringedBar: {
                  __typename: 'QueryStringedBar',
                  type: 'QueryStringedBar',
                  text: 'Value text',
                  bar: {
                    __typename: 'QueryBar',
                    id: barId,
                    info: { name: createBarResult.value.info.name },
                    fields: { title: 'Bar title' },
                  },
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
      createContext(),
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
      createNotAuthenticatedContext(),
      { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' }
    );
    expect(result.data).toEqual({
      node: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotAuthenticated: No schema

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
    const { adminClient } = server;
    const createFoo1Result = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Howdy name 1' },
    });
    const createFoo2Result = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Howdy name 2' },
    });
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const {
        id: foo1Id,
        info: { name: foo1Name },
      } = createFoo1Result.value;
      const {
        id: foo2Id,
        info: { name: foo2Name },
      } = createFoo2Result.value;

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
                info {
                  name
                }
              }
            }
          }
        `,
        undefined,
        createContext(),
        { ids: [foo1Id, foo2Id] }
      );
      expect(result).toEqual({
        data: {
          nodes: [
            {
              __typename: 'QueryFoo',
              id: foo1Id,
              info: {
                name: foo1Name,
              },
            },
            {
              __typename: 'QueryFoo',
              id: foo2Id,
              info: { name: foo2Name },
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
      createContext(),
      { ids: ['6043cb20-50dc-43d9-8d55-fc9b892b30af'] }
    );
    expect(result.data).toEqual({
      nodes: [null],
    });
    expect(result.errors).toBeFalsy();
  });
});
