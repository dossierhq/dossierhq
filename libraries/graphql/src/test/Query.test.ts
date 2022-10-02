import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import {
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  FieldType,
  notOk,
  ok,
} from '@jonasb/datadata-core';
import { expectOkResult } from '@jonasb/datadata-core-vitest';
import type { GraphQLSchema } from 'graphql';
import { graphql, printError } from 'graphql';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { SessionGraphQLContext } from '../GraphQLSchemaGenerator.js';
import { GraphQLSchemaGenerator } from '../GraphQLSchemaGenerator.js';
import type { TestServerWithSession } from './TestUtils.js';
import { setUpServerWithSession } from './TestUtils.js';

let server: TestServerWithSession;
let schema: GraphQLSchema;

const schemaSpecification: AdminSchemaSpecificationUpdate = {
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
  server = await setUpServerWithSession(schemaSpecification, 'data/query.sqlite');
  schema = new GraphQLSchemaGenerator({
    adminSchema: null,
    publishedSchema: server.schema.toPublishedSchema(),
  }).buildSchema();
});

afterAll(async () => {
  await server?.tearDown();
});

function createContext(): SessionGraphQLContext {
  return {
    adminClient: ok(server.adminClient),
    publishedClient: ok(server.publishedClient),
  };
}

function createNotAuthenticatedContext(): SessionGraphQLContext {
  return {
    adminClient: notOk.NotAuthenticated('No adminClient'),
    publishedClient: notOk.NotAuthenticated('No publishedClient'),
  };
}

describe('node()', () => {
  test('Query all fields of created entity', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Howdy name', authKey: 'none' },
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
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version: 0 }]));

      const result = await graphql({
        schema,
        source: `
          query Entity($id: ID!) {
            node(id: $id) {
              __typename
              id
              ... on PublishedQueryFoo {
                info {
                  name
                  authKey
                  createdAt
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
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result).toEqual({
        data: {
          node: {
            __typename: 'PublishedQueryFoo',
            id,
            info: { name, authKey: 'none', createdAt: createdAt.toISOString() },
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
      info: { type: 'QueryFoo', name: 'Howdy name', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version: 0 }]));

      const result = await graphql({
        schema,
        source: `
          query Entity($id: ID!) {
            node(id: $id) {
              __typename
              id
              ... on PublishedQueryFoo {
                info {
                  name
                  authKey
                  createdAt
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
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result).toEqual({
        data: {
          node: {
            __typename: 'PublishedQueryFoo',
            id,
            info: { name, authKey: 'none', createdAt: createdAt.toISOString() },
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
    const body = createRichTextRootNode([
      createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
    ]);
    const createFooResult = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Foo name', authKey: 'none' },
      fields: { body },
    });
    if (expectOkResult(createFooResult)) {
      const {
        entity: {
          id: fooId,
          info: { name },
        },
      } = createFooResult.value;

      expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

      const result = await graphql({
        schema,
        source: `
          query Entity($id: ID!) {
            node(id: $id) {
              __typename
              id
              ... on PublishedQueryFoo {
                info {
                  name
                  authKey
                }
                fields {
                  body {
                    root
                    entities {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id: fooId },
      });
      expect(result).toEqual({
        data: {
          node: {
            __typename: 'PublishedQueryFoo',
            id: fooId,
            info: { name, authKey: 'none' },
            fields: {
              body: { ...body, entities: [] },
            },
          },
        },
      });
    }
  });

  test('Query rich text with reference', async () => {
    const { adminClient } = server;

    const {
      entity: {
        id: bar1Id,
        info: { name: bar1Name },
      },
    } = (
      await adminClient.createEntity(
        {
          info: { type: 'QueryBar', name: 'Bar 1 name', authKey: 'none' },
          fields: { title: 'Bar title' },
        },
        { publish: true }
      )
    ).valueOrThrow();

    const {
      entity: {
        id: bar2Id,
        info: { name: bar2Name },
      },
    } = (
      await adminClient.createEntity(
        {
          info: { type: 'QueryBar', name: 'Bar 2 name', authKey: 'none' },
          fields: { title: 'Bar title' },
        },
        { publish: true }
      )
    ).valueOrThrow();

    const body = createRichTextRootNode([
      createRichTextEntityNode({ id: bar1Id }),
      createRichTextParagraphNode([
        createRichTextEntityLinkNode({ id: bar2Id }, [createRichTextTextNode('Hello world')]),
      ]),
    ]);
    const {
      entity: {
        id: fooId,
        info: { name: fooName },
      },
    } = (
      await adminClient.createEntity(
        {
          info: { type: 'QueryFoo', name: 'Foo name', authKey: 'none' },
          fields: {
            body,
          },
        },
        { publish: true }
      )
    ).valueOrThrow();

    const result = await graphql({
      schema,
      source: `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on PublishedQueryFoo {
                  info {
                    name
                    authKey
                  }
                  fields {
                    body {
                      root
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
      contextValue: createContext(),
      variableValues: { id: fooId },
    });
    expect(result).toEqual({
      data: {
        node: {
          __typename: 'PublishedQueryFoo',
          id: fooId,
          info: { name: fooName, authKey: 'none' },
          fields: {
            body: {
              ...body,
              entities: [
                { id: bar1Id, info: { name: bar1Name } },
                { id: bar2Id, info: { name: bar2Name } },
              ],
            },
          },
        },
      },
    });
  });

  test('Query referenced entity', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'QueryBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryFoo', name: 'Foo name', authKey: 'none' },
        fields: { title: 'Foo title', bar: { id: barId } },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name: fooName },
          },
        } = createFooResult.value;

        expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

        const result = await graphql({
          schema,
          source: `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on PublishedQueryFoo {
                  info {
                    name
                    authKey
                  }
                  fields {
                    title
                    bar {
                      __typename
                      id
                      info {
                        name
                        authKey
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
          contextValue: createContext(),
          variableValues: { id: fooId },
        });
        expect(result).toEqual({
          data: {
            node: {
              __typename: 'PublishedQueryFoo',
              id: fooId,
              info: { name: fooName, authKey: 'none' },
              fields: {
                title: 'Foo title',
                bar: {
                  __typename: 'PublishedQueryBar',
                  id: barId,
                  info: { name: barName, authKey: 'none' },
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
      info: { type: 'QueryBar', name: 'Bar 1 name', authKey: 'none' },
      fields: { title: 'Bar 1 title' },
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'QueryBar', name: 'Bar 2 name', authKey: 'none' },
      fields: { title: 'Bar 2 title' },
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        entity: {
          id: bar1Id,
          info: { name: bar1Name },
        },
      } = createBar1Result.value;
      const {
        entity: {
          id: bar2Id,
          info: { name: bar2Name },
        },
      } = createBar2Result.value;

      expectOkResult(
        await adminClient.publishEntities([
          { id: bar1Id, version: 0 },
          { id: bar2Id, version: 0 },
        ])
      );

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryFoo', name: 'Foo name', authKey: 'none' },
        fields: { title: 'Foo title', bars: [{ id: bar1Id }, { id: bar2Id }] },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name: fooName },
          },
        } = createFooResult.value;

        expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

        const result = await graphql({
          schema,
          source: `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on PublishedQueryFoo {
                  info {
                    name
                    authKey
                  }
                  fields {
                    title
                    bars {
                      __typename
                      id
                      info {
                        name
                        authKey
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
          contextValue: createContext(),
          variableValues: { id: fooId },
        });
        expect(result).toEqual({
          data: {
            node: {
              __typename: 'PublishedQueryFoo',
              id: fooId,
              info: { name: fooName, authKey: 'none' },
              fields: {
                title: 'Foo title',
                bars: [
                  {
                    __typename: 'PublishedQueryBar',
                    id: bar1Id,
                    info: { name: bar1Name, authKey: 'none' },
                    fields: { title: 'Bar 1 title' },
                  },
                  {
                    __typename: 'PublishedQueryBar',
                    id: bar2Id,
                    info: { name: bar2Name, authKey: 'none' },
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
      info: { type: 'QueryBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      expectOkResult(await adminClient.publishEntities([{ id: barId, version: 0 }]));

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryFoo', name: 'Foo name', authKey: 'none' },
        fields: {
          title: 'Foo title',
          stringedBar: { type: 'QueryStringedBar', text: 'Value text', bar: { id: barId } },
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name: fooName },
          },
        } = createFooResult.value;

        expectOkResult(await adminClient.publishEntities([{ id: fooId, version: 0 }]));

        const result = await graphql({
          schema,
          source: `
            query Entity($id: ID!) {
              node(id: $id) {
                __typename
                id
                ... on PublishedQueryFoo {
                  info {
                    name
                    authKey
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
                          authKey
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
          contextValue: createContext(),
          variableValues: { id: fooId },
        });
        expect(result).toEqual({
          data: {
            node: {
              __typename: 'PublishedQueryFoo',
              id: fooId,
              info: { name: fooName, authKey: 'none' },
              fields: {
                title: 'Foo title',
                stringedBar: {
                  __typename: 'PublishedQueryStringedBar',
                  type: 'QueryStringedBar',
                  text: 'Value text',
                  bar: {
                    __typename: 'PublishedQueryBar',
                    id: barId,
                    info: { name: barName, authKey: 'none' },
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
    const result = await graphql({
      schema,
      source: `
        query Entity($id: ID!) {
          node(id: $id) {
            id
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' },
    });
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
    const result = await graphql({
      schema,
      source: `
        query Entity($id: ID!) {
          node(id: $id) {
            id
          }
        }
      `,
      contextValue: createNotAuthenticatedContext(),
      variableValues: { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' },
    });
    expect(result.data).toEqual({
      node: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotAuthenticated: No publishedClient

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
      info: { type: 'QueryFoo', name: 'Howdy name 1', authKey: 'none' },
      fields: {},
    });
    const createFoo2Result = await adminClient.createEntity({
      info: { type: 'QueryFoo', name: 'Howdy name 2', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const {
        entity: {
          id: foo1Id,
          info: { name: foo1Name, createdAt: foo1CreatedAt },
        },
      } = createFoo1Result.value;
      const {
        entity: {
          id: foo2Id,
          info: { name: foo2Name, createdAt: foo2CreatedAt },
        },
      } = createFoo2Result.value;

      expectOkResult(
        await adminClient.publishEntities([
          { id: foo1Id, version: 0 },
          { id: foo2Id, version: 0 },
        ])
      );

      const result = await graphql({
        schema,
        source: `
          query Entities($ids: [ID!]!) {
            nodes(ids: $ids) {
              __typename
              id
              ... on PublishedQueryFoo {
                info {
                  name
                  authKey
                  createdAt
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { ids: [foo1Id, foo2Id] },
      });
      expect(result).toEqual({
        data: {
          nodes: [
            {
              __typename: 'PublishedQueryFoo',
              id: foo1Id,
              info: { name: foo1Name, authKey: 'none', createdAt: foo1CreatedAt.toISOString() },
            },
            {
              __typename: 'PublishedQueryFoo',
              id: foo2Id,
              info: { name: foo2Name, authKey: 'none', createdAt: foo2CreatedAt.toISOString() },
            },
          ],
        },
      });
    }
  });

  test('Error: Query invalid id', async () => {
    const result = await graphql({
      schema,
      source: `
        query Entities($ids: [ID!]!) {
          nodes(ids: $ids) {
            id
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { ids: ['6043cb20-50dc-43d9-8d55-fc9b892b30af'] },
    });
    expect(result.data).toEqual({
      nodes: [null],
    });
    expect(result.errors).toBeFalsy();
  });
});
