import type {
  AdminClient,
  AdminEntity,
  AdminSchemaSpecificationUpdate,
  BoundingBox,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  assertOkResult,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
  FieldType,
  getAllPagesForConnection,
  notOk,
  ok,
} from '@jonasb/datadata-core';
import { expectOkResult } from '@jonasb/datadata-core-vitest';
import type { GraphQLSchema } from 'graphql';
import { graphql, printError } from 'graphql';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { SessionGraphQLContext } from '../GraphQLSchemaGenerator.js';
import { GraphQLSchemaGenerator } from '../GraphQLSchemaGenerator.js';
import { expectSampledEntitiesArePartOfExpected } from './SampleTestUtils.js';
import type { TestServerWithSession } from './TestUtils.js';
import { setUpServerWithSession } from './TestUtils.js';

let server: TestServerWithSession;
let schema: GraphQLSchema;
let entitiesOfTypeQueryAdminOnlyEditBeforeNone: AdminEntity[];
let entitiesOfTypeQueryAdminOnlyEditBeforeSubject: AdminEntity[];

const schemaSpecification: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'QueryAdminFoo',
      fields: [
        { name: 'title', type: FieldType.String, isName: true },
        { name: 'slug', type: FieldType.String, index: 'queryAdminSlug' },
        { name: 'summary', type: FieldType.String },
        { name: 'tags', type: FieldType.String, list: true },
        { name: 'body', type: FieldType.RichText },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'active', type: FieldType.Boolean },
        { name: 'activeList', type: FieldType.Boolean, list: true },
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
  indexes: [
    {
      name: 'queryAdminSlug',
      type: 'unique',
    },
  ],
};

const ADMIN_FOO_QUERY = `
query AdminEntity($id: ID, $version: Int, $index: AdminUniqueIndex, $value: String) {
  adminEntity(id: $id, version: $version, index: $index, value: $value) {
    __typename
    id
    info {
      type
      name
      version
      authKey
      status
    }
    ... on AdminQueryAdminFoo {
      fields {
        title
        slug
        summary
        tags
        active
        activeList
        bar { id }
        bars { id }
        location {
          lat
          lng
        }
        locations {
          lat
          lng
        }
        stringedBar {
          type
        }
      }
    }
  }
}
`;

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
    adminSchema: server.schema,
    publishedSchema: null,
  }).buildSchema();

  const { adminClient } = server;

  await ensureTestEntitiesExist(adminClient, 'none');
  entitiesOfTypeQueryAdminOnlyEditBeforeNone = await getEntitiesForAdminOnlyEditBefore(
    adminClient,
    'none'
  );

  await ensureTestEntitiesExist(adminClient, 'subject');
  entitiesOfTypeQueryAdminOnlyEditBeforeSubject = await getEntitiesForAdminOnlyEditBefore(
    adminClient,
    'subject'
  );
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

async function ensureTestEntitiesExist(adminClient: AdminClient, authKey: string) {
  const requestedCount = 50;
  const entitiesOfTypeCount = await adminClient.getTotalCount({
    authKeys: [authKey],
    entityTypes: ['QueryAdminOnlyEditBefore'],
  });

  if (expectOkResult(entitiesOfTypeCount)) {
    for (let count = entitiesOfTypeCount.value; count < requestedCount; count += 1) {
      const random = String(Math.random()).slice(2);
      const createResult = await adminClient.createEntity({
        info: { type: 'QueryAdminOnlyEditBefore', name: random, authKey },
        fields: { message: `Hey ${random}` },
      });
      createResult.throwIfError();
    }
  }
}

async function getEntitiesForAdminOnlyEditBefore(adminClient: AdminClient, authKey: string) {
  const query = { authKeys: [authKey], entityTypes: ['QueryAdminOnlyEditBefore'] };
  const entities: AdminEntity[] = [];
  for await (const pageResult of getAllPagesForConnection({}, (currentPaging) =>
    adminClient.searchEntities(query, currentPaging)
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
  const { adminClient } = server;
  const createBarResult = await adminClient.createEntity({
    info: { type: 'QueryAdminBar', name: 'Bar', authKey: 'none' },
    fields: { title: 'Bar' },
  });
  if (createBarResult.isError()) {
    throw createBarResult.toError();
  }

  const {
    entity: { id: barId },
  } = createBarResult.value;

  const fooEntities: AdminEntity[] = [];

  for (let i = 0; i < fooCount; i += 1) {
    const createFooResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Foo: ' + i, authKey: 'none' },
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

describe('adminEntity()', () => {
  test('With unique index', async () => {
    const { adminClient } = server;
    const slug = Math.random().toString();
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name', authKey: 'none' },
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

    const result = await graphql({
      schema,
      source: ADMIN_FOO_QUERY,
      contextValue: createContext(),
      variableValues: { index: 'queryAdminSlug', value: slug },
    });
    expect(result).toEqual({
      data: {
        adminEntity: {
          __typename: 'AdminQueryAdminFoo',
          id,
          info: {
            version: 0,
            type: 'QueryAdminFoo',
            name,
            authKey: 'none',
            status: AdminEntityStatus.draft,
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
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name', authKey: 'none' },
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

      const result = await graphql({
        schema,
        source: ADMIN_FOO_QUERY,
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result).toEqual({
        data: {
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id,
            info: {
              version: 0,
              type: 'QueryAdminFoo',
              name,
              authKey: 'none',
              status: AdminEntityStatus.draft,
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
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name', authKey: 'none' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name },
        },
      } = createResult.value;

      const result = await graphql({
        schema,
        source: ADMIN_FOO_QUERY,
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result).toEqual({
        data: {
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id,
            info: {
              type: 'QueryAdminFoo',
              name,
              version: 0,
              authKey: 'none',
              status: AdminEntityStatus.draft,
            },
            fields: ADMIN_FOO_EMPTY_FIELDS,
          },
        },
      });
    }
  });

  test('Query different versions of same entity created entity', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'First name', authKey: 'none' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      expectOkResult(
        await adminClient.updateEntity({
          id,
          fields: { title: 'Second title', summary: 'Second summary' },
        })
      );

      const result = await graphql({
        schema,
        source: `
          query FourVersionsOfAdminEntity(
            $id: ID!
            $version1: Int!
            $version2: Int!
            $version3: Int!
            $version4: Int
          ) {
            first: adminEntity(id: $id, version: $version1) {
              id
              info {
                version
              }
              ... on AdminQueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
            second: adminEntity(id: $id, version: $version2) {
              id
              info {
                version
              }
              ... on AdminQueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
            third: adminEntity(id: $id, version: $version3) {
              id
              info {
                version
              }
              ... on AdminQueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
            fourth: adminEntity(id: $id, version: $version4) {
              id
              info {
                version
              }
              ... on AdminQueryAdminFoo {
                fields {
                  title
                  summary
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id, version1: 0, version2: 1, version3: 100, version4: null },
      });
      expect(result.data).toEqual({
        first: {
          id,
          info: { version: 0 },
          fields: {
            title: 'First title',
            summary: 'First summary',
          },
        },
        second: {
          id,
          info: { version: 1 },
          fields: {
            title: 'Second title',
            summary: 'Second summary',
          },
        },
        third: null, // invalid version
        fourth: {
          //default to max
          id,
          info: { version: 1 },
          fields: {
            title: 'Second title',
            summary: 'Second summary',
          },
        },
      });
      const errorStrings = result.errors?.map(printError);
      expect(errorStrings).toMatchInlineSnapshot(`
        [
          "NotFound: No such entity or version

        GraphQL request:33:13
        32 |             }
        33 |             third: adminEntity(id: $id, version: $version3) {
           |             ^
        34 |               id",
        ]
      `);
    }
  });

  test('Query published entity', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'First name', authKey: 'none' },
      fields: { title: 'First title', summary: 'First summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, version },
        },
      } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version }]));

      const result = await graphql({
        schema,
        source: `
          query AdminEntity($id: ID!) {
            adminEntity(id: $id) {
              id
              info {
                version
                name
                authKey
                status
              }
              ... on AdminQueryAdminFoo {
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
        adminEntity: {
          id,
          info: {
            version: 0,
            name,
            authKey: 'none',
            status: AdminEntityStatus.published,
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
    const { adminClient } = server;
    const body = createRichTextRootNode([
      createRichTextParagraphNode([createRichTextTextNode('Hello foo world')]),
    ]);
    const createFooResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Foo name', authKey: 'none' },
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
        source: `
          query Entity($id: ID!) {
            adminEntity(id: $id) {
              __typename
              id
              info {
                type
                name
                version
              }
              ... on AdminQueryAdminFoo {
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
          adminEntity: {
            __typename: 'AdminQueryAdminFoo',
            id: fooId,
            info: {
              type: 'QueryAdminFoo',
              name: fooName,
              version: 0,
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
    const { adminClient } = server;
    const createBar1Result = await adminClient.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name 1', authKey: 'none' },
      fields: { title: 'Bar title 1' },
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name 2', authKey: 'none' },
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

      const body = createRichTextRootNode([
        createRichTextEntityNode({ id: bar1Id }),
        createRichTextValueItemNode({
          type: 'QueryAdminStringedBar',
          text: 'Hello',
          bar: { id: bar2Id },
        }),
      ]);
      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name', authKey: 'none' },
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
          source: `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                info {
                  type
                  name
                  version
                }
                ... on AdminQueryAdminFoo {
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
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              info: {
                type: 'QueryAdminFoo',
                name: fooName,
                version: 0,
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
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name', authKey: 'none' },
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
          source: `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                info {
                  type
                  name
                  version
                }
                ... on AdminQueryAdminFoo {
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
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              info: {
                type: 'QueryAdminFoo',
                name: fooName,
                version: 0,
              },
              fields: {
                title: 'Foo title',
                bar: {
                  __typename: 'AdminQueryAdminBar',
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
    const { adminClient } = server;
    const createBar1Result = await adminClient.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar 1 name', authKey: 'none' },
      fields: { title: 'Bar 1 title' },
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar 2 name', authKey: 'none' },
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

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name', authKey: 'none' },
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
          source: `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                ... on AdminQueryAdminFoo {
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
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              info: { name: fooName },
              fields: {
                title: 'Foo title',
                bars: [
                  {
                    __typename: 'AdminQueryAdminBar',
                    id: bar1Id,
                    info: { name: bar1Name },
                    fields: { title: 'Bar 1 title' },
                  },
                  {
                    __typename: 'AdminQueryAdminBar',
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

  test('Query value type', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'QueryAdminBar', name: 'Bar name', authKey: 'none' },
      fields: { title: 'Bar title' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      const createFooResult = await adminClient.createEntity({
        info: { type: 'QueryAdminFoo', name: 'Foo name', authKey: 'none' },
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
          source: `
            query Entity($id: ID!) {
              adminEntity(id: $id) {
                __typename
                id
                info {
                  type
                  name
                  version
                }
                ... on AdminQueryAdminFoo {
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
            adminEntity: {
              __typename: 'AdminQueryAdminFoo',
              id: fooId,
              info: {
                type: 'QueryAdminFoo',
                name: fooName,
                version: 0,
              },
              fields: {
                title: 'Foo title',
                stringedBar: {
                  __typename: 'AdminQueryAdminStringedBar',
                  type: 'QueryAdminStringedBar',
                  text: 'Stringed text',
                  bar: {
                    __typename: 'AdminQueryAdminBar',
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
      source: `
        query AdminEntity($id: ID!) {
          adminEntity(id: $id) {
            id
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' },
    });
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
    const result = await graphql({
      schema,
      source: `
        query AdminEntity($id: ID!) {
          adminEntity(id: $id) {
            id
          }
        }
      `,
      contextValue: createNotAuthenticatedContext(),
      variableValues: { id: '6043cb20-50dc-43d9-8d55-fc9b892b30af' },
    });
    expect(result.data).toEqual({
      adminEntity: null,
    });
    const errorStrings = result.errors?.map(printError);
    expect(errorStrings).toEqual([
      `NotAuthenticated: No adminClient

GraphQL request:3:11
2 |         query AdminEntity($id: ID!) {
3 |           adminEntity(id: $id) {
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
        source: `
        query AdminEntity($id: ID!) {
          adminEntity(id: $id) {
            id
          }
        }
      `,
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result.data).toEqual({
        adminEntity: null,
      });
      const errorStrings = result.errors?.map(printError);
      expect(errorStrings).toEqual([
        `NotAuthorized: Wrong authKey provided

GraphQL request:3:11
2 |         query AdminEntity($id: ID!) {
3 |           adminEntity(id: $id) {
  |           ^
4 |             id`,
      ]);
    }
  });

  test('Error: No args', async () => {
    const result = await graphql({
      schema,
      source: ADMIN_FOO_QUERY,
      contextValue: createContext(),
      variableValues: {},
    });
    expect(result.data).toEqual({ adminEntity: null });
    const errorStrings = result.errors?.map((it) => it.toString());
    expect(errorStrings).toMatchInlineSnapshot(`
      [
        "Either (id), (id and version) or (index and value) must be specified

      GraphQL request:3:3
      2 | query AdminEntity($id: ID, $version: Int, $index: AdminUniqueIndex, $value: String) {
      3 |   adminEntity(id: $id, version: $version, index: $index, value: $value) {
        |   ^
      4 |     __typename",
      ]
    `);
  });

  test('Error: Index, no value', async () => {
    const result = await graphql({
      schema,
      source: ADMIN_FOO_QUERY,
      contextValue: createContext(),
      variableValues: { index: 'queryAdminSlug' },
    });
    expect(result.data).toEqual({ adminEntity: null });
    const errorStrings = result.errors?.map((it) => it.toString());
    expect(errorStrings).toMatchInlineSnapshot(`
      [
        "Either (id), (id and version) or (index and value) must be specified

      GraphQL request:3:3
      2 | query AdminEntity($id: ID, $version: Int, $index: AdminUniqueIndex, $value: String) {
      3 |   adminEntity(id: $id, version: $version, index: $index, value: $value) {
        |   ^
      4 |     __typename",
      ]
    `);
  });
});

describe('adminEntities()', () => {
  test('Query 2 entities', async () => {
    const { adminClient } = server;
    const createFoo1Result = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name 1', authKey: 'none' },
      fields: {},
    });
    const createFoo2Result = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name 2', authKey: 'none' },
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
        source: `
          query Entities($ids: [ID!]!) {
            adminEntities(ids: $ids) {
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
          adminEntities: [
            {
              __typename: 'AdminQueryAdminFoo',
              id: foo1Id,
              info: {
                type: 'QueryAdminFoo',
                authKey: 'none',
                status: AdminEntityStatus.draft,
                name: foo1Name,
              },
            },
            {
              __typename: 'AdminQueryAdminFoo',
              id: foo2Id,
              info: {
                type: 'QueryAdminFoo',
                authKey: 'none',
                status: AdminEntityStatus.draft,
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
      source: `
        query Entities($ids: [ID!]!) {
          adminEntities(ids: $ids) {
            id
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { ids: ['6043cb20-50dc-43d9-8d55-fc9b892b30af'] },
    });
    expect(result.data).toEqual({
      adminEntities: [null],
    });
    expect(result.errors).toBeFalsy();
  });
});

describe('adminSampleEntities()', () => {
  test('20 entities', async () => {
    const result = (await graphql({
      schema,
      source: `
        {
          adminSampleEntities(query: { entityTypes: [QueryAdminOnlyEditBefore] }, seed: 123, count: 20) {
            seed
            totalCount
            items {
              id
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.error).toBeUndefined();
    expectSampledEntitiesArePartOfExpected(
      result.data?.adminSampleEntities,
      123,
      entitiesOfTypeQueryAdminOnlyEditBeforeNone
    );
  });
});

describe('searchAdminEntities()', () => {
  test('Default => 25', async () => {
    const result = (await graphql({
      schema,
      source: `
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
      contextValue: createContext(),
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(0, 25).map((x) => ({ node: { id: x.id } }))
    );
    expect(result.data?.adminSearchEntities.totalCount).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.length
    );
  });

  test('Default => 25, filter type as argument', async () => {
    const result = (await graphql({
      schema,
      source: `
        query Search($entityTypes: [AdminEntityType!]) {
          adminSearchEntities(query: { entityTypes: $entityTypes }) {
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
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(0, 25).map((x) => ({ node: { id: x.id } }))
    );
  });

  test('first 10', async () => {
    const result = (await graphql({
      schema,
      source: `
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
      contextValue: createContext(),
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(0, 10).map((x) => ({ node: { id: x.id } }))
    );
  });

  test('first 10 reversed', async () => {
    const result = (await graphql({
      schema,
      source: `
        {
          adminSearchEntities(query: { entityTypes: [QueryAdminOnlyEditBefore], reverse: true }, first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
      contextValue: createContext(),
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.data?.adminSearchEntities.edges).toEqual(
      [...entitiesOfTypeQueryAdminOnlyEditBeforeNone]
        .reverse()
        .slice(0, 10)
        .map((x) => ({ node: { id: x.id } }))
    );
  });

  test('last 10', async () => {
    const result = (await graphql({
      schema,
      source: `
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
      contextValue: createContext(),
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeNone.slice(-10).map((x) => ({ node: { id: x.id } }))
    );
  });

  test('last 10, ordered by name', async () => {
    const result = (await graphql({
      schema,
      source: `
        {
          adminSearchEntities(
            query: { entityTypes: [QueryAdminOnlyEditBefore], order: name }
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
      contextValue: createContext(),
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.errors).toBeUndefined();
    expect(result.data?.adminSearchEntities.edges).toEqual(
      [...entitiesOfTypeQueryAdminOnlyEditBeforeNone]
        .sort((a, b) => (a.info.name < b.info.name ? -1 : 1))
        .slice(-10)
        .map((x) => ({ node: { id: x.id } }))
    );
  });

  test('Filter based on authKey (subject)', async () => {
    const result = (await graphql({
      schema,
      source: `
        {
          adminSearchEntities(query: { authKeys: ["subject"] entityTypes: [QueryAdminOnlyEditBefore] }) {
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
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(result.data?.adminSearchEntities.edges).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeSubject
        .slice(0, 25)
        .map((it) => ({ node: { id: it.id, info: { authKey: 'subject' } } }))
    );
    expect(result.data?.adminSearchEntities.totalCount).toEqual(
      entitiesOfTypeQueryAdminOnlyEditBeforeSubject.length
    );
  });

  test('Filter based on linksTo, one reference', async () => {
    const { barId, fooEntities } = await createBarWithFooReferences(1);
    const [fooEntity] = fooEntities;

    const result = await graphql({
      schema,
      source: `
        query QueryReferencing($id: ID!) {
          adminSearchEntities(query: { linksTo: {id: $id } }) {
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
        adminSearchEntities: {
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
      source: `
        query QueryReferencing($id: ID!) {
          adminSearchEntities(query: { linksFrom: { id: $id } }) {
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
        adminSearchEntities: {
          totalCount: 1,
          edges: [{ node: { id: barId } }],
        },
      },
    });
  });

  test('Filter based on bounding box', async () => {
    const { adminClient } = server;
    const boundingBox = randomBoundingBox();
    const center = {
      lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
      lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
    };
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name', authKey: 'none' },
      fields: { location: center },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id: fooId },
      } = createResult.value;

      const result = (await graphql({
        schema,
        source: `
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
        contextValue: createContext(),
        variableValues: { boundingBox },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(result?.data?.adminSearchEntities.totalCount).toBeGreaterThanOrEqual(1);

      let fooIdCount = 0;
      for (const edge of result.data.adminSearchEntities.edges) {
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
      source: `
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
      contextValue: createContext(),
      variableValues: { text: 'Hey' }, // There are at least 50 QueryAdminOnlyEditBefore entities
    })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(result?.data?.adminSearchEntities.totalCount).toBeGreaterThanOrEqual(50);
    expect(result?.data?.adminSearchEntities.edges.length).toBe(25);
  });
});

describe('entityHistory()', () => {
  test('History with edit', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Foo name', authKey: 'none' },
      fields: { title: 'First title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const updateResult = await adminClient.updateEntity({
        id,
        fields: { title: 'Updated title' },
      });
      if (expectOkResult(updateResult)) {
        expectOkResult(
          await adminClient.publishEntities([
            { id, version: updateResult.value.entity.info.version },
          ])
        );
      }

      const result = (await graphql({
        schema,
        source: `
          query EntityHistory($id: ID!) {
            entityHistory(id: $id) {
              id
              versions {
                version
                published
                createdBy
                createdAt
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result.errors).toBeUndefined();

      // Remove createdAt since it's tricky to test 🤷‍♂️
      result.data?.entityHistory.versions.forEach(
        (x: { createdAt?: string }) => delete x.createdAt
      );

      expect(result.data).toEqual({
        entityHistory: {
          id,
          versions: [
            { createdBy: server.subjectId, published: false, version: 0 },
            { createdBy: server.subjectId, published: true, version: 1 },
          ],
        },
      });
    }
  });

  test('Error: invalid id', async () => {
    const result = await graphql({
      schema,
      source: `
        query EntityHistory($id: ID!) {
          entityHistory(id: $id) {
            id
            versions {
              version
            }
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: '6698130c-b56d-48cd-81f5-1f74bedc552e' },
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "entityHistory": null,
        },
        "errors": [
          [GraphQLError: NotFound: No such entity],
        ],
      }
    `);
  });

  test('Error: Wrong authKey', async () => {
    const { adminClientOther } = server;
    const createResult = await adminClientOther.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name', authKey: 'subject' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = (await graphql({
        schema,
        source: `
          query EntityHistory($id: ID!) {
            entityHistory(id: $id) {
              id
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "entityHistory": null,
          },
          "errors": [
            [GraphQLError: NotAuthorized: Wrong authKey provided],
          ],
        }
      `);
    }
  });
});

describe('publishingHistory()', () => {
  test('History with published', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Foo name', authKey: 'none' },
      fields: { title: 'First title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { version },
        },
      } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version }]));

      const result = (await graphql({
        schema,
        source: `
          query PublishingHistory($id: ID!) {
            publishingHistory(id: $id) {
              id
              events {
                version
                publishedBy
                publishedAt
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(result.errors).toBeUndefined();
      const { publishedAt } = result.data.publishingHistory.events[0];

      expect(result.data).toEqual({
        publishingHistory: {
          id,
          events: [{ publishedBy: server.subjectId, publishedAt, version: 0 }],
        },
      });
    }
  });

  test('Error: invalid id', async () => {
    const result = await graphql({
      schema,
      source: `
        query PublishingHistory($id: ID!) {
          publishingHistory(id: $id) {
            id
            events {
              version
            }
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: '6698130c-b56d-48cd-81f5-1f74bedc552e' },
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "publishingHistory": null,
        },
        "errors": [
          [GraphQLError: NotFound: No such entity],
        ],
      }
    `);
  });

  test('Error: Wrong authKey', async () => {
    const { adminClientOther } = server;
    const createResult = await adminClientOther.createEntity({
      info: { type: 'QueryAdminFoo', name: 'Howdy name', authKey: 'subject' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = (await graphql({
        schema,
        source: `
          query PublishingHistory($id: ID!) {
            publishingHistory(id: $id) {
              id
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "publishingHistory": null,
          },
          "errors": [
            [GraphQLError: NotAuthorized: Wrong authKey provided],
          ],
        }
      `);
    }
  });
});
