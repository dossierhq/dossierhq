import type {
  DossierClient,
  Entity,
  SchemaSpecificationUpdate,
  BoundingBox,
} from '@dossierhq/core';
import {
  EntityStatus,
  EventType,
  FieldType,
  assertOkResult,
  createRichText,
  createRichTextComponentNode,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  getAllPagesForConnection,
  notOk,
  ok,
} from '@dossierhq/core';
import { expectOkResult } from '@dossierhq/core-vitest';
import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import { afterAll, assert, beforeAll, describe, expect, test } from 'vitest';
import type { SessionGraphQLContext } from '../GraphQLSchemaGenerator.js';
import { GraphQLSchemaGenerator } from '../GraphQLSchemaGenerator.js';
import { expectSampledEntitiesArePartOfExpected } from './SampleTestUtils.js';
import type { TestServerWithSession } from './TestUtils.js';
import { setUpServerWithSession } from './TestUtils.js';
import { adminEntityChangelogEvents } from './queries/adminEntityChangelogEvents.js';
import { adminEntityFoo } from './queries/adminEntityFoo.js';
import { globalChangelogEvents } from './queries/globalChangelogEvents.js';

const gql = String.raw;

let server: TestServerWithSession;
let schema: GraphQLSchema;
let entitiesOfTypeQueryAdminOnlyEditBeforeNone: Entity[];
let entitiesOfTypeQueryAdminOnlyEditBeforeSubject: Entity[];

const schemaSpecification: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'QueryAdminFoo',
      nameField: 'title',
      authKeyPattern: 'subjectOrDefault',
      fields: [
        { name: 'title', type: FieldType.String },
        { name: 'slug', type: FieldType.String, index: 'queryAdminSlug' },
        { name: 'summary', type: FieldType.String },
        { name: 'tags', type: FieldType.String, list: true },
        { name: 'body', type: FieldType.RichText },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'active', type: FieldType.Boolean },
        { name: 'activeList', type: FieldType.Boolean, list: true },
        { name: 'bar', type: FieldType.Reference, entityTypes: ['QueryAdminBar'] },
        {
          name: 'bars',
          type: FieldType.Reference,
          list: true,
          entityTypes: ['QueryAdminBar'],
        },
        {
          name: 'stringedBar',
          type: FieldType.Component,
          componentTypes: ['QueryAdminStringedBar'],
        },
      ],
    },
    { name: 'QueryAdminBar', fields: [{ name: 'title', type: FieldType.String }] },
    {
      name: 'QueryAdminOnlyEditBefore',
      authKeyPattern: 'subjectOrDefault',
      fields: [{ name: 'message', type: FieldType.String }],
    },
  ],
  componentTypes: [
    {
      name: 'QueryAdminStringedBar',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'bar', type: FieldType.Reference, entityTypes: ['QueryAdminBar'] },
      ],
    },
  ],
  indexes: [
    {
      name: 'queryAdminSlug',
      type: 'unique',
    },
  ],
  patterns: [{ name: 'subjectOrDefault', pattern: '^(?:subject|)$' }],
};

const ADMIN_FOO_EMPTY_FIELDS = {
  title: null,
  slug: null,
  summary: null,
  tags: null,
  active: null,
  activeList: null,
  bar: null,
  bars: null,
  location: null,
  locations: null,
  stringedBar: null,
};

beforeAll(async () => {
  server = await setUpServerWithSession(schemaSpecification, 'data/query-admin.sqlite');
  schema = new GraphQLSchemaGenerator({
    schema: server.schema,
    publishedSchema: null,
  }).buildSchema();

  const { client } = server;

  await ensureTestEntitiesExist(client, '');
  entitiesOfTypeQueryAdminOnlyEditBeforeNone = await getEntitiesForAdminOnlyEditBefore(client, '');

  await ensureTestEntitiesExist(client, 'subject');
  entitiesOfTypeQueryAdminOnlyEditBeforeSubject = await getEntitiesForAdminOnlyEditBefore(
    client,
    'subject',
  );
});

afterAll(async () => {
  await server?.tearDown();
});

function createContext(): SessionGraphQLContext {
  return {
    client: ok(server.client),
    publishedClient: ok(server.publishedClient),
  };
}

function createNotAuthenticatedContext(): SessionGraphQLContext {
  return {
    client: notOk.NotAuthenticated('No client'),
    publishedClient: notOk.NotAuthenticated('No publishedClient'),
  };
}

async function ensureTestEntitiesExist(client: DossierClient, authKey: string) {
  const requestedCount = 50;
  const entitiesOfTypeCount = await client.getEntitiesTotalCount({
    authKeys: [authKey],
    entityTypes: ['QueryAdminOnlyEditBefore'],
  });

  if (expectOkResult(entitiesOfTypeCount)) {
    for (let count = entitiesOfTypeCount.value; count < requestedCount; count += 1) {
      const random = String(Math.random()).slice(2);
      const createResult = await client.createEntity({
        info: { type: 'QueryAdminOnlyEditBefore', name: random, authKey },
        fields: { message: `Hey ${random}` },
      });
      createResult.throwIfError();
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(client: DossierClient, authKey: string) {
  const query = { authKeys: [authKey], entityTypes: ['QueryAdminOnlyEditBefore'] };
  const entities: Entity[] = [];
  for await (const pageResult of getAllPagesForConnection({}, (currentPaging) =>
    client.getEntities(query, currentPaging),
  )) {
    if (pageResult.isError()) {
      throw pageResult.toError();
    }
    for (const edge of pageResult.value.edges) {
      if (edge.node.isOk()) {
        entities.push(edge.node.value);
      }
    }
  }

  return entities;
}

async function createBarWithFooReferences(fooCount: number) {
  const { client } = server;
  const createBarResult = await client.createEntity({
    info: { type: 'QueryAdminBar', name: 'Bar' },
    fields: { title: 'Bar' },
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const {
    entity: { id: barId },
  } = createBarResult.value;

  const fooEntities: Entity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Foo: ' + i },
      fields: { bar: { id: barId } },
    });
    if (expectOkResult(createFooResult)) {
      fooEntities.push(createFooResult.value.entity);
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

describe('entity()', () => {
  test('With unique index', async () => {
    const { client } = server;
    const slug = Math.random().toString();
    const createResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name' },
      fields: {
        title: 'Howdy title',
        summary: 'Howdy summary',
        slug,
      },
    });
    assertOkResult(createResult);
    const {
      entity: {
        id,
        info: { name },
      },
    } = createResult.value;

    const result = await adminEntityFoo(schema, createContext(), {
      index: 'queryAdminSlug',
      value: slug,
    });
    expect(result).toEqual({
      data: {
        entity: {
          __typename: 'QueryAdminFoo',
          id,
          info: {
            version: 1,
            type: 'QueryAdminFoo',
            name,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
          },
          fields: {
            ...ADMIN_FOO_EMPTY_FIELDS,
            title: 'Howdy title',
            summary: 'Howdy summary',
            slug,
          },
        },
      },
    });
  });

  test('Query all fields of created entity', async () => {
    const { client } = server;
    const createResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name' },
      fields: {
        title: 'Howdy title',
        summary: 'Howdy summary',
        tags: ['one', 'two', 'three'],
        active: true,
        activeList: [true, false, true],
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name },
        },
      } = createResult.value;

      const result = await adminEntityFoo(schema, createContext(), { id });
      expect(result).toEqual({
        data: {
          entity: {
            __typename: 'QueryAdminFoo',
            id,
            info: {
              version: 1,
              type: 'QueryAdminFoo',
              name,
              authKey: '',
              status: EntityStatus.draft,
              valid: true,
              validPublished: null,
            },
            fields: {
              ...ADMIN_FOO_EMPTY_FIELDS,
              title: 'Howdy title',
              summary: 'Howdy summary',
              tags: ['one', 'two', 'three'],
              active: true,
              activeList: [true, false, true],
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
    const { client } = server;
    const createResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name },
        },
      } = createResult.value;

      const result = await adminEntityFoo(schema, createContext(), { id });
      expect(result).toEqual({
        data: {
          entity: {
            __typename: 'QueryAdminFoo',
            id,
            info: {
              type: 'QueryAdminFoo',
              name,
              version: 1,
              authKey: '',
              status: EntityStatus.draft,
              valid: true,
              validPublished: null,
            },
            fields: ADMIN_FOO_EMPTY_FIELDS,
          },
        },
      });
    }
  });

  test('Query different versions of same entity created entity', async () => {
    const { client } = server;
    const createResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      expectOkResult(
        await client.updateEntity({
          id,
          fields: { title: 'Second title', summary: 'Second summary' },
        }),
      );

      const result = await graphql({
        schema,
        source: gql`
          query FourVersionsOfAdminEntity(
            $id: ID!
            $version1: Int!
            $version2: Int!
            $version3: Int!
            $version4: Int
          ) {
            first: entity(id: $id, version: $version1) {
              id
              info {
                version
              }
              ... on QueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
            second: entity(id: $id, version: $version2) {
              id
              info {
                version
              }
              ... on QueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
            third: entity(id: $id, version: $version3) {
              id
              info {
                version
              }
              ... on QueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
            fourth: entity(id: $id, version: $version4) {
              id
              info {
                version
              }
              ... on QueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id, version1: 1, version2: 2, version3: 100, version4: null },
      });
      expect(result.data).toEqual({
        first: {
          id,
          info: { version: 1 },
          fields: {
            title: 'First title',
            summary: 'First summary',
          },
        },
        second: {
          id,
          info: { version: 2 },
          fields: {
            title: 'Second title',
            summary: 'Second summary',
          },
        },
        third: null, // invalid version
        fourth: {
          //default to max
          id,
          info: { version: 2 },
          fields: {
            title: 'Second title',
            summary: 'Second summary',
          },
        },
      });
      const errorStrings = result.errors?.map((it) => it.toString());
      expect(errorStrings).toMatchInlineSnapshot(`
        [
          "NotFound: No such entity or version

        GraphQL request:33:13
        32 |             }
        33 |             third: entity(id: $id, version: $version3) {
           |             ^
        34 |               id",
        ]
      `);
    }
  });

  test('Query published entity', async () => {
    const { client } = server;
    const createResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, version },
        },
      } = createResult.value;

      expectOkResult(await client.publishEntities([{ id, version }]));

      const result = await graphql({
        schema,
        source: gql`
          query Entity($id: ID!) {
            entity(id: $id) {
              id
              info {
                version
                name
                authKey
                status
              }
              ... on QueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        entity: {
          id,
          info: {
            version: 1,
            name,
            authKey: '',
            status: EntityStatus.published,
          },
          fields: {
            title: 'First title',
            summary: 'First summary',
          },
        },
      });
    }
  });

  test('Query rich text field', async () => {
    const { client } = server;
    const body = createRichText([
      createRichTextParagraphNode([createRichTextTextNode('Hello foo world')]),
    ]);
    const createFooResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Foo name' },
      fields: {
        body,
      },
    });
    if (expectOkResult(createFooResult)) {
      const {
        entity: {
          id: fooId,
          info: { name: fooName },
        },
      } = createFooResult.value;

      const result = await graphql({
        schema,
        source: gql`
          query Entity($id: ID!) {
            entity(id: $id) {
              __typename
              id
              info {
                type
                name
                version
              }
              ... on QueryAdminFoo {
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

      expect(result.errors).toBeUndefined();
      expect(result).toEqual({
        data: {
          entity: {
            __typename: 'QueryAdminFoo',
            id: fooId,
            info: {
              type: 'QueryAdminFoo',
              name: fooName,
              version: 1,
            },
            fields: {
              body: { ...body, entities: [] },
            },
          },
        },
      });
    }
  });

  test('Query rich text with references', async () => {
    const { client } = server;
    const createBar1Result = await client.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name 1' },
      fields: { title: 'Bar title 1' },
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name 2' },
      fields: { title: 'Bar title 2' },
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

      const body = createRichText([
        createRichTextEntityNode({ id: bar1Id }),
        createRichTextComponentNode({
          type: 'QueryAdminStringedBar',
          text: 'Hello',
          bar: { id: bar2Id },
        }),
      ]);
      const createFooResult = await client.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name' },
        fields: {
          body,
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name: fooName },
          },
        } = createFooResult.value;

        const result = await graphql({
          schema,
          source: gql`
            query Entity($id: ID!) {
              entity(id: $id) {
                __typename
                id
                info {
                  type
                  name
                  version
                }
                ... on QueryAdminFoo {
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
            entity: {
              __typename: 'QueryAdminFoo',
              id: fooId,
              info: {
                type: 'QueryAdminFoo',
                name: fooName,
                version: 1,
              },
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
      }
    }
  });

  test('Query referenced entity', async () => {
    const { client } = server;
    const createBarResult = await client.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name' },
        fields: { title: 'Foo title', bar: { id: barId } },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name: fooName },
          },
        } = createFooResult.value;

        const result = await graphql({
          schema,
          source: gql`
            query Entity($id: ID!) {
              entity(id: $id) {
                __typename
                id
                info {
                  type
                  name
                  version
                }
                ... on QueryAdminFoo {
                  fields {
                    title
                    bar {
                      __typename
                      id
                      info {
                        type
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
          contextValue: createContext(),
          variableValues: { id: fooId },
        });
        expect(result).toEqual({
          data: {
            entity: {
              __typename: 'QueryAdminFoo',
              id: fooId,
              info: {
                type: 'QueryAdminFoo',
                name: fooName,
                version: 1,
              },
              fields: {
                title: 'Foo title',
                bar: {
                  __typename: 'QueryAdminBar',
                  id: barId,
                  info: {
                    type: 'QueryAdminBar',
                    name: barName,
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
    const { client } = server;
    const createBar1Result = await client.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar 1 name' },
      fields: { title: 'Bar 1 title' },
    });
    const createBar2Result = await client.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar 2 name' },
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

      const createFooResult = await client.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name' },
        fields: { title: 'Foo title', bars: [{ id: bar1Id }, { id: bar2Id }] },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name: fooName },
          },
        } = createFooResult.value;

        const result = await graphql({
          schema,
          source: gql`
            query Entity($id: ID!) {
              entity(id: $id) {
                __typename
                id
                ... on QueryAdminFoo {
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
          contextValue: createContext(),
          variableValues: { id: fooId },
        });

        expect(result.errors).toBeUndefined();
        expect(result).toEqual({
          data: {
            entity: {
              __typename: 'QueryAdminFoo',
              id: fooId,
              info: { name: fooName },
              fields: {
                title: 'Foo title',
                bars: [
                  {
                    __typename: 'QueryAdminBar',
                    id: bar1Id,
                    info: { name: bar1Name },
                    fields: { title: 'Bar 1 title' },
                  },
                  {
                    __typename: 'QueryAdminBar',
                    id: bar2Id,
                    info: { name: bar2Name },
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

  test('Query component type', async () => {
    const { client } = server;
    const createBarResult = await client.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      const createFooResult = await client.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          stringedBar: {
            type: 'QueryAdminStringedBar',
            text: 'Stringed text',
            bar: { id: barId },
          },
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: {
            id: fooId,
            info: { name: fooName },
          },
        } = createFooResult.value;

        const result = await graphql({
          schema,
          source: gql`
            query Entity($id: ID!) {
              entity(id: $id) {
                __typename
                id
                info {
                  type
                  name
                  version
                }
                ... on QueryAdminFoo {
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
                          type
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
          contextValue: createContext(),
          variableValues: { id: fooId },
        });

        expect(result.errors).toBeUndefined();
        expect(result).toEqual({
          data: {
            entity: {
              __typename: 'QueryAdminFoo',
              id: fooId,
              info: {
                type: 'QueryAdminFoo',
                name: fooName,
                version: 1,
              },
              fields: {
                title: 'Foo title',
                stringedBar: {
                  __typename: 'QueryAdminStringedBar',
                  type: 'QueryAdminStringedBar',
                  text: 'Stringed text',
                  bar: {
                    __typename: 'QueryAdminBar',
                    id: barId,
                    info: {
                      type: 'QueryAdminBar',
                      name: barName,
                    },
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
      source: gql`
        query Entity($id: ID!) {
          entity(id: $id) {
            id
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' },
    });
    expect(result.data).toEqual({
      entity: null,
    });
    const errorStrings = result.errors?.map((it) => it.toString());
    expect(errorStrings).toEqual([
      `NotFound: No such entity

GraphQL request:3:11
2 |         query Entity($id: ID!) {
3 |           entity(id: $id) {
  |           ^
4 |             id`,
    ]);
  });

  test('Error: No session', async () => {
    const result = await graphql({
      schema,
      source: gql`
        query Entity($id: ID!) {
          entity(id: $id) {
            id
          }
        }
      `,
      contextValue: createNotAuthenticatedContext(),
      variableValues: { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' },
    });
    expect(result.data).toEqual({
      entity: null,
    });
    const errorStrings = result.errors?.map((it) => it.toString());
    expect(errorStrings).toEqual([
      `NotAuthenticated: No client

GraphQL request:3:11
2 |         query Entity($id: ID!) {
3 |           entity(id: $id) {
  |           ^
4 |             id`,
    ]);
  });

  test('Error: Query using the wrong authKey', async () => {
    const { adminClientOther } = server;
    const createResult = await adminClientOther.createEntity({
      info: { type: 'QueryAdminFoo', name: 'First name', authKey: 'subject' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = await graphql({
        schema,
        source: gql`
          query Entity($id: ID!) {
            entity(id: $id) {
              id
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result.data).toEqual({
        entity: null,
      });
      const errorStrings = result.errors?.map((it) => it.toString());
      expect(errorStrings).toMatchInlineSnapshot(`
        [
          "NotAuthorized: Wrong authKey provided

        GraphQL request:3:13
        2 |           query Entity($id: ID!) {
        3 |             entity(id: $id) {
          |             ^
        4 |               id",
        ]
      `);
    }
  });

  test('Error: No args', async () => {
    const result = await adminEntityFoo(schema, createContext(), {});
    expect(result.data).toEqual({ entity: null });
    const errorStrings = result.errors?.map((it) => it.toString());
    expect(errorStrings).toMatchInlineSnapshot(`
      [
        "Either (id), (id and version) or (index and value) must be specified

      GraphQL request:3:5
      2 |   query Entity($id: ID, $version: Int, $index: UniqueIndex, $value: String) {
      3 |     entity(id: $id, version: $version, index: $index, value: $value) {
        |     ^
      4 |       __typename",
      ]
    `);
  });

  test('Error: Index, no value', async () => {
    const result = await adminEntityFoo(schema, createContext(), { index: 'queryAdminSlug' });
    expect(result.data).toEqual({ entity: null });
    const errorStrings = result.errors?.map((it) => it.toString());
    expect(errorStrings).toMatchInlineSnapshot(`
      [
        "Either (id), (id and version) or (index and value) must be specified

      GraphQL request:3:5
      2 |   query Entity($id: ID, $version: Int, $index: UniqueIndex, $value: String) {
      3 |     entity(id: $id, version: $version, index: $index, value: $value) {
        |     ^
      4 |       __typename",
      ]
    `);
  });
});

describe('entity.changelogEvents()', () => {
  test('Get events for existing entity', async () => {
    const entity = entitiesOfTypeQueryAdminOnlyEditBeforeNone[0];
    const result = await adminEntityChangelogEvents(schema, createContext(), { id: entity.id });
    expect(result.errors).toBeUndefined();

    expect(result.data?.entity.changelogEvents.totalCount).toEqual(1);

    expect(result.data?.entity.changelogEvents.edges.length).toEqual(1);
    const firstEdge = result.data?.entity.changelogEvents.edges[0];
    assert(firstEdge);
    const firstEvent = firstEdge.node;
    assert(firstEvent);
    expect(firstEvent.type).toBe(EventType.createEntity);

    expect(result.data?.entity.changelogEvents.pageInfo.hasPreviousPage).toBeFalsy();
    expect(result.data?.entity.changelogEvents.pageInfo.startCursor).toEqual(firstEdge.cursor);
  });
});

describe('entityList()', () => {
  test('Query 2 entities', async () => {
    const { client } = server;
    const createFoo1Result = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name 1' },
      fields: {},
    });
    const createFoo2Result = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name 2' },
      fields: {},
    });
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const {
        entity: {
          id: foo1Id,
          info: { name: foo1Name },
        },
      } = createFoo1Result.value;
      const {
        entity: {
          id: foo2Id,
          info: { name: foo2Name },
        },
      } = createFoo2Result.value;

      const result = await graphql({
        schema,
        source: gql`
          query Entities($ids: [ID!]!) {
            entityList(ids: $ids) {
              __typename
              id
              info {
                type
                name
                authKey
                status
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { ids: [foo1Id, foo2Id] },
      });
      expect(result).toEqual({
        data: {
          entityList: [
            {
              __typename: 'QueryAdminFoo',
              id: foo1Id,
              info: {
                type: 'QueryAdminFoo',
                authKey: '',
                status: EntityStatus.draft,
                name: foo1Name,
              },
            },
            {
              __typename: 'QueryAdminFoo',
              id: foo2Id,
              info: {
                type: 'QueryAdminFoo',
                authKey: '',
                status: EntityStatus.draft,
                name: foo2Name,
              },
            },
          ],
        },
      });
    }
  });

  test('Error: Query invalid id', async () => {
    const result = await graphql({
      schema,
      source: gql`
        query Entities($ids: [ID!]!) {
          entityList(ids: $ids) {
            id
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { ids: ['6043cb20-50dc-43d9-8d55-fc9b892b30af'] },
    });
    expect(result.data).toEqual({ entityList: [null] });
    expect(result.errors?.map((it) => it.toJSON())).toMatchInlineSnapshot(`
      [
        {
          "locations": [
            {
              "column": 11,
              "line": 3,
            },
          ],
          "message": "NotFound: No such entity",
          "path": [
            "entityList",
            0,
          ],
        },
      ]
    `);
  });
});

describe('adminEntitiesSample()', () => {
  test('20 entities', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        {
          entitiesSample(query: { entityTypes: [QueryAdminOnlyEditBefore] }, seed: 123, count: 20) {
            seed
            totalCount
            items {
              id
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as ExecutionResult<{
      entitiesSample: { seed: number; totalCount: number; items: { id: string }[] };
    }>;
    expect(result.errors).toBeUndefined();
    expectSampledEntitiesArePartOfExpected(
      result.data?.entitiesSample,
      123,
      entitiesOfTypeQueryAdminOnlyEditBeforeNone,
    );
  });
});

describe('searchAdminEntities()', () => {
  test('Default => 25', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        {
          entities(query: { entityTypes: [QueryAdminOnlyEditBefore] }) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as ExecutionResult<{
      entities: { totalCount: number; edges: { node: { id: string } }[] };
    }>;
    expect(result.data?.entities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(0, 25).map((x) => ({ node: { id: x.id } })),
    );
    expect(result.data?.entities.totalCount).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.length,
    );
  });

  test('Default => 25, filter type as argument', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        query Search($entityTypes: [EntityType!]) {
          entities(query: { entityTypes: $entityTypes }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { entityTypes: ['QueryAdminOnlyEditBefore'] },
    })) as ExecutionResult<{
      entities: { edges: { node: { id: string } }[] };
    }>;
    expect(result.data?.entities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(0, 25).map((x) => ({ node: { id: x.id } })),
    );
  });

  test('first 10', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        {
          entities(query: { entityTypes: [QueryAdminOnlyEditBefore] }, first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as ExecutionResult<{ entities: { edges: { node: { id: string } }[] } }>;
    expect(result.data?.entities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(0, 10).map((x) => ({ node: { id: x.id } })),
    );
  });

  test('first 10 reversed', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        {
          entities(query: { entityTypes: [QueryAdminOnlyEditBefore], reverse: true }, first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as ExecutionResult<{ entities: { edges: { node: { id: string } }[] } }>;
    expect(result.data?.entities.edges).toEqual(
      [...entitiesOfTypeQueryAdminOnlyEditBeforeNone]
        .reverse()
        .slice(0, 10)
        .map((x) => ({ node: { id: x.id } })),
    );
  });

  test('last 10', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        {
          entities(query: { entityTypes: [QueryAdminOnlyEditBefore] }, last: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as ExecutionResult<{ entities: { edges: { node: { id: string } }[] } }>;
    expect(result.data?.entities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(-10).map((x) => ({ node: { id: x.id } })),
    );
  });

  test('last 10, ordered by name', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        {
          entities(query: { entityTypes: [QueryAdminOnlyEditBefore], order: name }, last: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as ExecutionResult<{ entities: { edges: { node: { id: string } }[] } }>;
    expect(result.errors).toBeUndefined();
    expect(result.data?.entities.edges).toEqual(
      [...entitiesOfTypeQueryAdminOnlyEditBeforeNone]
        .sort((a, b) => (a.info.name < b.info.name ? -1 : 1))
        .slice(-10)
        .map((x) => ({ node: { id: x.id } })),
    );
  });

  test('Filter based on authKey (subject)', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        {
          entities(query: { authKeys: ["subject"], entityTypes: [QueryAdminOnlyEditBefore] }) {
            totalCount
            edges {
              node {
                id
                info {
                  authKey
                }
              }
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as ExecutionResult<{
      entities: { totalCount: number; edges: { node: { id: string } }[] };
    }>;
    expect(result.data?.entities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeSubject
        .slice(0, 25)
        .map((it) => ({ node: { id: it.id, info: { authKey: 'subject' } } })),
    );
    expect(result.data?.entities.totalCount).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeSubject.length,
    );
  });

  test('Filter based on componentTypes and linksTo', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);
    const [fooEntity] = fooEntities;

    const source = `query QueryWithComponentTypesAndLinksTo($id: ID!) {
      entities(query: { linksTo: {id: $id }, componentTypes: [QueryAdminStringedBar] }) {
        edges {
          node {
            id
          }
        }
        totalCount
      }
    }`;

    const resultBefore = await graphql({
      schema,
      source,
      contextValue: createContext(),
      variableValues: { id: barId },
    });
    expect(resultBefore).toEqual({ data: { entities: null } });

    const updateResult = await server.client.updateEntity({
      id: fooEntity.id,
      fields: { stringedBar: { type: 'QueryAdminStringedBar', text: null, bar: null } },
    });
    assertOkResult(updateResult);

    const resultAfterUpdate = await graphql({
      schema,
      source,
      contextValue: createContext(),
      variableValues: { id: barId },
    });
    expect(resultAfterUpdate).toEqual({
      data: { entities: { edges: [{ node: { id: fooEntity.id } }], totalCount: 1 } },
    });
  });

  test('Filter based on linksTo, one reference', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);
    const [fooEntity] = fooEntities;

    const result = await graphql({
      schema,
      source: gql`
        query QueryReferencing($id: ID!) {
          entities(query: { linksTo: { id: $id } }) {
            edges {
              node {
                id
              }
            }
            totalCount
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: barId },
    });

    expect(result).toEqual({
      data: {
        entities: {
          totalCount: 1,
          edges: [{ node: { id: fooEntity.id } }],
        },
      },
    });
  });

  test('Filter based on linksFrom, one reference', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);
    const [fooEntity] = fooEntities;

    const result = await graphql({
      schema,
      source: gql`
        query QueryReferencing($id: ID!) {
          entities(query: { linksFrom: { id: $id } }) {
            edges {
              node {
                id
              }
            }
            totalCount
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: fooEntity.id },
    });

    expect(result).toEqual({
      data: {
        entities: {
          totalCount: 1,
          edges: [{ node: { id: barId } }],
        },
      },
    });
  });

  test('Filter based on bounding box', async () => {
    const { client } = server;
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const createResult = await client.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name' },
      fields: { location: center },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id: fooId },
      } = createResult.value;

      const result = (await graphql({
        schema,
        source: gql`
          query QueryBoundingBox($boundingBox: BoundingBoxInput!) {
            entities(query: { boundingBox: $boundingBox }) {
              edges {
                node {
                  id
                }
              }
              totalCount
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { boundingBox },
      })) as ExecutionResult<{
        entities: { totalCount: number; edges: { node: { id: string } }[] };
      }>;

      expect(result?.data?.entities.totalCount).toBeGreaterThanOrEqual(1);

      let fooIdCount = 0;
      for (const edge of result.data!.entities.edges) {
        if (edge.node.id === fooId) {
          fooIdCount += 1;
        }
      }
      expect(fooIdCount).toBe(1);
    }
  });

  test('Filter based on text', async () => {
    const result = (await graphql({
      schema,
      source: gql`
        query QueryBoundingBox($text: String!) {
          entities(query: { text: $text }) {
            edges {
              node {
                id
              }
            }
            totalCount
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { text: 'Hey' }, // There are at least 50 QueryAdminOnlyEditBefore entities
    })) as ExecutionResult<{
      entities: { totalCount: number; edges: { node: { id: string } }[] };
    }>;

    expect(result?.data?.entities.totalCount).toBeGreaterThanOrEqual(50);
    expect(result?.data?.entities.edges.length).toBe(25);
  });
});

describe('changelogEvents()', () => {
  test('Filter schemaUpdate events', async () => {
    const result = await globalChangelogEvents(schema, createContext(), {
      query: { types: [EventType.updateSchema] },
    });
    expect(result.errors).toBeUndefined();

    expect(result.data?.changelogEvents.totalCount).toBeGreaterThanOrEqual(1);

    expect(result.data?.changelogEvents.edges.length).toBeGreaterThanOrEqual(1);
    const firstEdge = result.data?.changelogEvents.edges[0];
    assert(firstEdge);
    const firstEvent = firstEdge.node;
    assert(firstEvent);
    expect(firstEvent.type).toBe(EventType.updateSchema);
    expect(firstEvent.version).toBeGreaterThanOrEqual(1);

    expect(result.data?.changelogEvents.pageInfo.hasPreviousPage).toBeFalsy();
    expect(result.data?.changelogEvents.pageInfo.startCursor).toEqual(firstEdge.cursor);
  });
});
