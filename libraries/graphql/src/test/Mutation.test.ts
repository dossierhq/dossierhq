import type {
  AdminEntityCreate,
  AdminEntityUpsert,
  SchemaSpecificationUpdate,
} from '@dossierhq/core';
import {
  EntityStatus,
  FieldType,
  createRichText,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  ok,
} from '@dossierhq/core';
import { expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { SessionGraphQLContext } from '../GraphQLSchemaGenerator.js';
import { GraphQLSchemaGenerator } from '../GraphQLSchemaGenerator.js';
import type { TestServerWithSession } from './TestUtils.js';
import { insecureTestUuidv4, setUpServerWithSession } from './TestUtils.js';

const gql = String.raw;

let server: TestServerWithSession;
let schema: GraphQLSchema;

const emptyFooFields = {
  title: null,
  summary: null,
  tags: null,
  body: null,
  location: null,
  locations: null,
  bar: null,
  bars: null,
  stringedBar: null,
  nestedValue: null,
  anyComponent: null,
  anyComponents: null,
};

const schemaSpecification: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'MutationFoo',
      nameField: 'title',
      authKeyPattern: 'anyAuthKey',
      fields: [
        { name: 'title', type: FieldType.String },
        { name: 'summary', type: FieldType.String },
        { name: 'tags', type: FieldType.String, list: true },
        { name: 'body', type: FieldType.RichText, entityTypes: ['MutationBar'] },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.Reference, entityTypes: ['MutationBar'] },
        {
          name: 'bars',
          type: FieldType.Reference,
          list: true,
          entityTypes: ['MutationBar'],
        },
        { name: 'stringedBar', type: FieldType.Component, componentTypes: ['MutationStringedBar'] },
        { name: 'nestedValue', type: FieldType.Component, componentTypes: ['MutationNestedValue'] },
        { name: 'anyComponent', type: FieldType.Component },
        { name: 'anyComponents', type: FieldType.Component, list: true },
      ],
    },
    { name: 'MutationBar', fields: [] },
  ],
  componentTypes: [
    {
      name: 'MutationStringedBar',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'bar', type: FieldType.Reference, entityTypes: ['MutationBar'] },
      ],
    },
    {
      name: 'MutationNestedValue',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'child', type: FieldType.Component, componentTypes: ['MutationNestedValue'] },
      ],
    },
  ],
  patterns: [{ name: 'anyAuthKey', pattern: '.*' }],
};

const createMutationFooGqlQuery = gql`
  mutation CreateFooEntity($entity: AdminMutationFooCreateInput!, $publish: Boolean) {
    createMutationFooEntity(entity: $entity, publish: $publish) {
      __typename
      effect
      entity {
        __typename
        id
        info {
          type
          name
          version
          authKey
          status
          createdAt
          updatedAt
        }
        fields {
          title
          summary
          tags
          location
          locations
        }
      }
    }
  }
`;

type CreateMutationFooGqlQueryResult = ExecutionResult<{
  createMutationFooEntity: {
    entity: { id: string; info: { name: string; createdAt: string; updatedAt: string } };
  };
}>;

const upsertMutationFooGqlQuery = gql`
  mutation UpsertFooEntity($entity: AdminMutationFooUpsertInput!, $publish: Boolean) {
    upsertMutationFooEntity(entity: $entity, publish: $publish) {
      effect
      entity {
        __typename
        id
        info {
          type
          name
          version
          authKey
          status
          createdAt
          updatedAt
        }
        fields {
          title
          summary
          tags
        }
      }
    }
  }
`;

type UpsertMutationFooGqlQueryResult = ExecutionResult<{
  upsertMutationFooEntity: {
    entity: { id: string; info: { name: string; createdAt: string; updatedAt: string } };
  };
}>;

beforeAll(async () => {
  server = await setUpServerWithSession(schemaSpecification, 'data/mutation.sqlite');
  schema = new GraphQLSchemaGenerator({
    adminSchema: server.schema,
    publishedSchema: null,
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

describe('create*Entity()', () => {
  test('Create', async () => {
    const { adminClient } = server;
    const entity: AdminEntityCreate = {
      info: { type: 'MutationFoo', name: 'Foo name' },
      fields: {
        title: 'Foo title',
        summary: 'Foo summary',
        tags: ['one', 'two', 'three'],
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      },
    };

    const result = (await graphql({
      schema,
      source: createMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: { entity },
    })) as CreateMutationFooGqlQueryResult;

    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    const {
      id,
      info: { name, createdAt, updatedAt },
    } = result.data!.createMutationFooEntity.entity;
    expect(name).toMatch(/^Foo name(#[0-9]+)?$/);

    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFooCreatePayload',
          effect: 'created',
          entity: {
            __typename: 'AdminMutationFoo',
            id,
            info: {
              type: 'MutationFoo',
              name,
              version: 1,
              authKey: '',
              status: EntityStatus.draft,
              createdAt,
              updatedAt,
            },
            fields: {
              title: 'Foo title',
              summary: 'Foo summary',
              tags: ['one', 'two', 'three'],
              location: { lat: 55.60498, lng: 13.003822 },
              locations: [
                { lat: 55.60498, lng: 13.003822 },
                { lat: 56.381561, lng: 13.99286 },
              ],
            },
          },
        },
      },
    });

    const getResult = await adminClient.getEntity({ id });
    expectResultValue(getResult, {
      id,
      info: {
        type: 'MutationFoo',
        name,
        version: 1,
        authKey: '',
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
      fields: {
        ...emptyFooFields,
        title: 'Foo title',
        summary: 'Foo summary',
        tags: ['one', 'two', 'three'],
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
      },
    });
  });

  test('Create with ID and version=1', async () => {
    const id = insecureTestUuidv4();
    const entity: AdminEntityCreate = {
      id,
      info: { type: 'MutationFoo', name: 'Foo name', version: 1 },
      fields: {
        title: 'Foo title',
        summary: 'Foo summary',
      },
    };
    const result = (await graphql({
      schema,
      source: createMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: {
        entity,
      },
    })) as CreateMutationFooGqlQueryResult;

    expect(result.errors).toBeUndefined();
    const { name, createdAt, updatedAt } = result.data!.createMutationFooEntity.entity.info;
    expect(name).toMatch(/^Foo name(#[0-9]+)?$/);

    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFooCreatePayload',
          effect: 'created',
          entity: {
            __typename: 'AdminMutationFoo',
            id,
            info: {
              type: 'MutationFoo',
              name,
              version: 1,
              authKey: '',
              status: EntityStatus.draft,
              createdAt,
              updatedAt,
            },
            fields: {
              title: 'Foo title',
              location: null,
              locations: null,
              summary: 'Foo summary',
              tags: null,
            },
          },
        },
      },
    });
  });

  test('Create and publish', async () => {
    const entity: AdminEntityCreate = {
      info: { type: 'MutationFoo', name: 'Foo name' },
      fields: {
        title: 'Foo title',
        summary: 'Foo summary',
      },
    };
    const result = (await graphql({
      schema,
      source: createMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: {
        entity,
        publish: true,
      },
    })) as CreateMutationFooGqlQueryResult;

    expect(result.errors).toBeUndefined();
    const {
      id,
      info: { name, createdAt, updatedAt },
    } = result.data!.createMutationFooEntity.entity;

    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFooCreatePayload',
          effect: 'createdAndPublished',
          entity: {
            __typename: 'AdminMutationFoo',
            id,
            info: {
              type: 'MutationFoo',
              name,
              version: 1,
              authKey: '',
              status: EntityStatus.published,
              createdAt,
              updatedAt,
            },
            fields: {
              title: 'Foo title',
              location: null,
              locations: null,
              summary: 'Foo summary',
              tags: null,
            },
          },
        },
      },
    });
  });

  test('Create with rich text with reference', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar' },
      fields: {},
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const body = createRichText([
        createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
        createRichTextEntityNode({ id: barId }),
      ]);
      const entity: AdminEntityCreate = {
        info: { type: 'MutationFoo', name: 'Foo name' },
        fields: {
          title: 'Foo title',
          summary: 'Foo summary',
          body,
        },
      };

      const gqlResult = (await graphql({
        schema,
        source: gql`
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  authKey
                  status
                  createdAt
                  updatedAt
                }
                fields {
                  title
                  summary
                  body {
                    root
                  }
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { entity },
      })) as ExecutionResult<{
        createMutationFooEntity: {
          entity: { id: string; info: { name: string; createdAt: string; updatedAt: string } };
        };
      }>;

      const {
        id: fooId,
        info: { name: fooName, createdAt, updatedAt },
      } = gqlResult.data!.createMutationFooEntity.entity;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            entity: {
              __typename: 'AdminMutationFoo',
              id: fooId,
              info: {
                type: 'MutationFoo',
                name: fooName,
                version: 1,
                authKey: '',
                status: EntityStatus.draft,
                createdAt,
                updatedAt,
              },
              fields: {
                title: 'Foo title',
                summary: 'Foo summary',
                body,
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        info: {
          type: 'MutationFoo',
          name: fooName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
        fields: {
          ...emptyFooFields,
          title: 'Foo title',
          summary: 'Foo summary',
          body: createRichText([
            createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
            createRichTextEntityNode({ id: barId }),
          ]),
        },
      });
    }
  });

  test('Create with reference', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar' },
      fields: {},
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      const entity: AdminEntityCreate = {
        info: {
          type: 'MutationFoo',
          name: 'Foo name',
        },
        fields: {
          title: 'Foo title',
          summary: 'Foo summary',
          bar: { id: barId },
        },
      };

      const gqlResult = (await graphql({
        schema,
        source: gql`
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  authKey
                  status
                  createdAt
                  updatedAt
                }
                fields {
                  title
                  summary
                  bar {
                    id
                    info {
                      name
                    }
                  }
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { entity },
      })) as ExecutionResult<{
        createMutationFooEntity: {
          entity: { id: string; info: { name: string; createdAt: string; updatedAt: string } };
        };
      }>;

      expect(gqlResult.errors).toBeUndefined();
      const {
        id: fooId,
        info: { name: fooName, createdAt, updatedAt },
      } = gqlResult.data!.createMutationFooEntity.entity;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            entity: {
              __typename: 'AdminMutationFoo',
              id: fooId,
              info: {
                type: 'MutationFoo',
                name: fooName,
                version: 1,
                authKey: '',
                status: EntityStatus.draft,
                createdAt,
                updatedAt,
              },
              fields: {
                title: 'Foo title',
                summary: 'Foo summary',
                bar: { id: barId, info: { name: barName } },
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        info: {
          type: 'MutationFoo',
          name: fooName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
        fields: {
          ...emptyFooFields,
          title: 'Foo title',
          summary: 'Foo summary',
          bar: { id: barId },
        },
      });
    }
  });

  test('Create with reference list', async () => {
    const { adminClient } = server;
    const createBar1Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 1' },
      fields: {},
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 2' },
      fields: {},
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

      const entity: AdminEntityCreate = {
        info: {
          type: 'MutationFoo',
          name: 'Foo name',
        },
        fields: {
          title: 'Foo title',
          summary: 'Foo summary',
          bars: [{ id: bar1Id }, { id: bar2Id }],
        },
      };

      const gqlResult = (await graphql({
        schema,
        source: gql`
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  createdAt
                  updatedAt
                }
                fields {
                  title
                  summary
                  bars {
                    id
                    info {
                      name
                    }
                  }
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { entity },
      })) as ExecutionResult<{
        createMutationFooEntity: {
          entity: { id: string; info: { name: string; createdAt: string; updatedAt: string } };
        };
      }>;

      expect(gqlResult.errors).toBeUndefined();
      const {
        id: fooId,
        info: { name: fooName, createdAt, updatedAt },
      } = gqlResult.data!.createMutationFooEntity.entity;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            entity: {
              __typename: 'AdminMutationFoo',
              id: fooId,
              info: {
                type: 'MutationFoo',
                name: fooName,
                version: 1,
                createdAt,
                updatedAt,
              },
              fields: {
                title: 'Foo title',
                summary: 'Foo summary',
                bars: [
                  { id: bar1Id, info: { name: bar1Name } },
                  { id: bar2Id, info: { name: bar2Name } },
                ],
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        info: {
          type: 'MutationFoo',
          name: fooName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
        fields: {
          ...emptyFooFields,
          title: 'Foo title',
          summary: 'Foo summary',
          bars: [{ id: bar1Id }, { id: bar2Id }],
        },
      });
    }
  });

  test('Create with component with reference', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar' },
      fields: {},
    });
    if (expectOkResult(createBarResult)) {
      const {
        entity: {
          id: barId,
          info: { name: barName },
        },
      } = createBarResult.value;

      const entity: AdminEntityCreate = {
        info: {
          type: 'MutationFoo',
          name: 'Foo name',
        },
        fields: {
          title: 'Foo title',
          summary: 'Foo summary',
          stringedBar: {
            type: 'MutationStringedBar',
            text: 'Value text',
            bar: { id: barId },
          },
        },
      };

      const gqlResult = (await graphql({
        schema,
        source: gql`
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  createdAt
                  updatedAt
                }
                fields {
                  title
                  summary
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
                    }
                  }
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { entity },
      })) as ExecutionResult<{
        createMutationFooEntity: {
          entity: { id: string; info: { name: string; createdAt: string; updatedAt: string } };
        };
      }>;

      expect(gqlResult.errors).toBeUndefined();
      const {
        id: fooId,
        info: { name: fooName, createdAt, updatedAt },
      } = gqlResult.data!.createMutationFooEntity.entity;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            entity: {
              __typename: 'AdminMutationFoo',
              id: fooId,
              info: {
                type: 'MutationFoo',
                name: fooName,
                version: 1,
                createdAt,
                updatedAt,
              },
              fields: {
                title: 'Foo title',
                summary: 'Foo summary',
                stringedBar: {
                  __typename: 'AdminMutationStringedBar',
                  type: 'MutationStringedBar',
                  text: 'Value text',
                  bar: {
                    __typename: 'AdminMutationBar',
                    id: barId,
                    info: {
                      type: 'MutationBar',
                      name: barName,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        info: {
          type: 'MutationFoo',
          name: fooName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
        fields: {
          ...emptyFooFields,
          title: 'Foo title',
          summary: 'Foo summary',
          stringedBar: {
            type: 'MutationStringedBar',
            text: 'Value text',
            bar: { id: barId },
          },
        },
      });
    }
  });

  test('Create with value JSON', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar', authKey: '' },
      fields: {},
    });

    if (expectOkResult(createBarResult)) {
      const {
        entity: { id: barId },
      } = createBarResult.value;

      const entity: AdminEntityCreate = {
        info: {
          type: 'MutationFoo',
          name: 'Foo name',
        },
        fields: {
          anyComponentJson: JSON.stringify({
            type: 'MutationStringedBar',
            text: 'A value',
            bar: { id: barId },
          }),
          anyComponentsJson: JSON.stringify([
            {
              type: 'MutationStringedBar',
              text: 'A value in a list',
              bar: { id: barId },
            },
          ]),
        },
      };

      const createFooResult = (await graphql({
        schema,
        source: gql`
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  createdAt
                  updatedAt
                }
                fields {
                  anyComponent {
                    __typename
                    type
                  }
                  anyComponents {
                    __typename
                    type
                  }
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: {
          entity,
          publish: true,
        },
      })) as ExecutionResult<{
        createMutationFooEntity: {
          entity: { id: string; info: { name: string; createdAt: string; updatedAt: string } };
        };
      }>;

      const {
        id: fooId,
        info: { name: fooName, createdAt, updatedAt },
      } = createFooResult.data!.createMutationFooEntity.entity;

      expect(createFooResult).toEqual({
        data: {
          createMutationFooEntity: {
            entity: {
              __typename: 'AdminMutationFoo',
              id: fooId,
              info: {
                type: 'MutationFoo',
                name: fooName,
                version: 1,
                createdAt,
                updatedAt,
              },
              fields: {
                anyComponent: {
                  __typename: 'AdminMutationStringedBar',
                  type: 'MutationStringedBar',
                },
                anyComponents: [
                  {
                    __typename: 'AdminMutationStringedBar',
                    type: 'MutationStringedBar',
                  },
                ],
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        info: {
          type: 'MutationFoo',
          name: fooName,
          version: 1,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
        fields: {
          ...emptyFooFields,
          anyComponent: {
            type: 'MutationStringedBar',
            text: 'A value',
            bar: { id: barId },
          },
          anyComponents: [
            {
              type: 'MutationStringedBar',
              text: 'A value in a list',
              bar: { id: barId },
            },
          ],
        },
      });
    }
  });

  test('Create nested component with inner JSON', async () => {
    const { adminClient } = server;
    const entity: AdminEntityCreate = {
      info: { type: 'MutationFoo', name: 'Foo name' },
      fields: {
        nestedValue: {
          type: 'MutationNestedValue',
          text: 'Outer',
          childJson: JSON.stringify({
            type: 'MutationNestedValue',
            text: 'Inner',
          }),
        },
      },
    };

    const createResult = (await graphql({
      schema,
      source: gql`
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
          createMutationFooEntity(entity: $entity) {
            entity {
              __typename
              id
              info {
                type
                name
                version
                createdAt
                updatedAt
              }
              fields {
                nestedValue {
                  __typename
                  type
                  text
                  child {
                    __typename
                    type
                    text
                    child {
                      __typename
                      type
                      text
                    }
                  }
                }
              }
            }
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { entity },
    })) as ExecutionResult<{
      createMutationFooEntity: {
        entity: {
          id: string;
          info: { name: string; createdAt: string; updatedAt: string };
        };
      };
    }>;

    const {
      id: fooId,
      info: { name: fooName, createdAt, updatedAt },
    } = createResult.data!.createMutationFooEntity.entity;

    expect(createResult).toEqual({
      data: {
        createMutationFooEntity: {
          entity: {
            __typename: 'AdminMutationFoo',
            id: fooId,
            info: {
              type: 'MutationFoo',
              name: fooName,
              version: 1,
              createdAt,
              updatedAt,
            },
            fields: {
              nestedValue: {
                __typename: 'AdminMutationNestedValue',
                type: 'MutationNestedValue',
                text: 'Outer',
                child: {
                  __typename: 'AdminMutationNestedValue',
                  type: 'MutationNestedValue',
                  text: 'Inner',
                  child: null,
                },
              },
            },
          },
        },
      },
    });

    const getResult = await adminClient.getEntity({ id: fooId });
    expectResultValue(getResult, {
      id: fooId,
      info: {
        type: 'MutationFoo',
        name: fooName,
        version: 1,
        authKey: '',
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
      fields: {
        ...emptyFooFields,
        nestedValue: {
          type: 'MutationNestedValue',
          text: 'Outer',
          child: { type: 'MutationNestedValue', text: 'Inner', child: null },
        },
      },
    });
  });

  test('Create without specifying type', async () => {
    const entity = {
      info: {
        name: 'Foo name',
      },
      fields: {
        title: 'Foo title',
        summary: 'Foo summary',
      },
    };

    const result = (await graphql({
      schema,
      source: gql`
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
          createMutationFooEntity(entity: $entity) {
            entity {
              __typename
              id
              info {
                type
                name
                version
              }
              fields {
                title
                summary
              }
            }
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { entity },
    })) as ExecutionResult<{
      createMutationFooEntity: {
        entity: {
          id: string;
          info: { name: string };
        };
      };
    }>;

    expect(result.errors).toBeUndefined();
    const id = result.data?.createMutationFooEntity.entity.id;
    const name = result.data?.createMutationFooEntity.entity.info.name;
    expect(name).toMatch(/^Foo name(#[0-9]+)?$/);

    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          entity: {
            __typename: 'AdminMutationFoo',
            id,
            info: {
              type: 'MutationFoo',
              name,
              version: 1,
            },
            fields: {
              title: 'Foo title',
              summary: 'Foo summary',
            },
          },
        },
      },
    });
  });

  test('Error: Create with the wrong type', async () => {
    const result = await graphql({
      schema,
      source: createMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: {
        entity: {
          info: {
            type: 'MutationBar', // should be Foo
            name: 'Foo name',
          },
          fields: {
            title: 'Foo title',
            summary: 'Foo summary',
          },
        },
      },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "createMutationFooEntity": null,
        },
        "errors": [
          [GraphQLError: BadRequest: Specified type (entity.info.type=MutationBar) should be MutationFoo],
        ],
      }
    `);
  });

  test('Error: Create with the wrong version', async () => {
    const result = await graphql({
      schema,
      source: createMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: {
        entity: {
          info: {
            type: 'MutationFoo',
            name: 'Foo name',
            version: 0,
          },
          fields: {
            title: 'Foo title',
            summary: 'Foo summary',
          },
        },
      },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "createMutationFooEntity": null,
        },
        "errors": [
          [GraphQLError: BadRequest: entity.info.version: Version must be 1 when creating a new entity],
        ],
      }
    `);
  });
});

describe('update*Entity()', () => {
  test('Update minimal', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary', tags: ['one', 'two', 'three'] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;
      const result = (await graphql({
        schema,
        source: gql`
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
            updateMutationFooEntity(entity: $entity) {
              effect
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  authKey
                  status
                  createdAt
                  updatedAt
                }
                fields {
                  title
                  summary
                  tags
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: {
          entity: { id, fields: { title: 'Updated title' } },
        },
      })) as ExecutionResult<{
        updateMutationFooEntity: {
          entity: { info: { updatedAt: string } };
        };
      }>;

      const { updatedAt } = result.data!.updateMutationFooEntity.entity.info;

      expect(result).toEqual({
        data: {
          updateMutationFooEntity: {
            effect: 'updated',
            entity: {
              __typename: 'AdminMutationFoo',
              id,
              info: {
                type: 'MutationFoo',
                name,
                version: 2,
                authKey: '',
                status: EntityStatus.draft,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt,
              },
              fields: {
                title: 'Updated title',
                summary: 'First summary',
                tags: ['one', 'two', 'three'],
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'MutationFoo',
          name,
          version: 2,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt,
          updatedAt: new Date(updatedAt),
        },
        fields: {
          ...emptyFooFields,
          title: 'Updated title',
          summary: 'First summary',
          tags: ['one', 'two', 'three'],
        },
      });
    }
  });

  test('Update with version', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary', tags: ['one', 'two', 'three'] },
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
        source: gql`
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
            updateMutationFooEntity(entity: $entity) {
              effect
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  authKey
                  status
                }
                fields {
                  title
                  summary
                  tags
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: {
          entity: {
            id,
            info: { type: 'MutationFoo', version: 2 },
            fields: { title: 'Updated title' },
          },
        },
      });

      expect(result).toEqual({
        data: {
          updateMutationFooEntity: {
            effect: 'updated',
            entity: {
              __typename: 'AdminMutationFoo',
              id,
              info: {
                type: 'MutationFoo',
                name,
                version: 2,
                authKey: '',
                status: EntityStatus.draft,
              },
              fields: {
                title: 'Updated title',
                summary: 'First summary',
                tags: ['one', 'two', 'three'],
              },
            },
          },
        },
      });
    }
  });

  test('Update with all values including references', async () => {
    const { adminClient } = server;
    const createBar1Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 1' },
      fields: {},
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 2' },
      fields: {},
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
        info: { type: 'MutationFoo', name: 'First name' },
        fields: {
          title: 'First title',
          summary: 'First summary',
          tags: ['one', 'two', 'three'],
        },
      });
      if (expectOkResult(createFooResult)) {
        const {
          entity: { id: fooId },
        } = createFooResult.value;
        const result = (await graphql({
          schema,
          source: gql`
            mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
              updateMutationFooEntity(entity: $entity) {
                __typename
                effect
                entity {
                  __typename
                  id
                  info {
                    type
                    name
                    version
                    createdAt
                    updatedAt
                  }
                  fields {
                    title
                    summary
                    tags
                    bar {
                      __typename
                      id
                      info {
                        type
                        name
                      }
                    }
                    bars {
                      __typename
                      id
                      info {
                        type
                        name
                      }
                    }
                    stringedBar {
                      __typename
                      type
                      text
                      bar {
                        __typename
                        id
                      }
                    }
                    anyComponent {
                      __typename
                      type
                    }
                    anyComponents {
                      __typename
                      type
                    }
                  }
                }
              }
            }
          `,
          contextValue: createContext(),
          variableValues: {
            entity: {
              id: fooId,
              info: {
                type: 'MutationFoo',
                name: 'Updated name',
              },
              fields: {
                title: 'Updated title',
                summary: 'Updated summary',
                tags: ['these', 'are', 'new'],
                bar: { id: bar1Id },
                bars: [{ id: bar1Id }, { id: bar2Id }],
                stringedBar: {
                  type: 'MutationStringedBar',
                  text: 'Value text',
                  bar: { id: bar2Id },
                },
                anyComponentJson: JSON.stringify({
                  type: 'MutationStringedBar',
                  text: 'A component',
                  bar: { id: bar1Id },
                }),
                anyComponentsJson: JSON.stringify([
                  {
                    type: 'MutationStringedBar',
                    text: 'A component in a list',
                    bar: { id: bar2Id },
                  },
                ]),
              },
            },
          },
        })) as ExecutionResult<{
          updateMutationFooEntity: {
            entity: {
              info: {
                name: string;
                createdAt: string;
                updatedAt: string;
              };
            };
          };
        }>;

        expect(result.errors).toBeFalsy();
        const { name, createdAt, updatedAt } = result.data!.updateMutationFooEntity.entity.info;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expect(result).toEqual({
          data: {
            updateMutationFooEntity: {
              __typename: 'AdminMutationFooUpdatePayload',
              effect: 'updated',
              entity: {
                __typename: 'AdminMutationFoo',
                id: fooId,
                info: {
                  type: 'MutationFoo',
                  name: name,
                  version: 2,
                  createdAt,
                  updatedAt,
                },
                fields: {
                  title: 'Updated title',
                  summary: 'Updated summary',
                  tags: ['these', 'are', 'new'],
                  bar: {
                    __typename: 'AdminMutationBar',
                    id: bar1Id,
                    info: {
                      type: 'MutationBar',
                      name: bar1Name,
                    },
                  },
                  bars: [
                    {
                      __typename: 'AdminMutationBar',
                      id: bar1Id,
                      info: {
                        type: 'MutationBar',
                        name: bar1Name,
                      },
                    },
                    {
                      __typename: 'AdminMutationBar',
                      id: bar2Id,
                      info: {
                        type: 'MutationBar',
                        name: bar2Name,
                      },
                    },
                  ],
                  stringedBar: {
                    __typename: 'AdminMutationStringedBar',
                    type: 'MutationStringedBar',
                    text: 'Value text',
                    bar: {
                      __typename: 'AdminMutationBar',
                      id: bar2Id,
                    },
                  },
                  anyComponent: {
                    __typename: 'AdminMutationStringedBar',
                    type: 'MutationStringedBar',
                  },
                  anyComponents: [
                    {
                      __typename: 'AdminMutationStringedBar',
                      type: 'MutationStringedBar',
                    },
                  ],
                },
              },
            },
          },
        });

        const getResult = await adminClient.getEntity({ id: fooId });
        expectResultValue(getResult, {
          id: fooId,
          info: {
            type: 'MutationFoo',
            name: name,
            version: 2,
            authKey: '',
            status: EntityStatus.draft,
            valid: true,
            validPublished: null,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
          fields: {
            ...emptyFooFields,
            title: 'Updated title',
            summary: 'Updated summary',
            tags: ['these', 'are', 'new'],
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
            stringedBar: {
              type: 'MutationStringedBar',
              text: 'Value text',
              bar: { id: bar2Id },
            },
            anyComponent: {
              type: 'MutationStringedBar',
              text: 'A component',
              bar: { id: bar1Id },
            },
            anyComponents: [
              {
                type: 'MutationStringedBar',
                text: 'A component in a list',
                bar: { id: bar2Id },
              },
            ],
          },
        });
      }
    }
  });

  test('Update and publish', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'First name' },
      fields: { title: 'First title', summary: 'First summary', tags: ['one', 'two', 'three'] },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt },
        },
      } = createResult.value;
      const result = (await graphql({
        schema,
        source: gql`
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
            updateMutationFooEntity(entity: $entity, publish: true) {
              effect
              entity {
                __typename
                id
                info {
                  type
                  name
                  version
                  authKey
                  status
                  createdAt
                  updatedAt
                }
                fields {
                  title
                  summary
                  tags
                }
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: {
          entity: { id, fields: { title: 'Updated title' } },
        },
      })) as ExecutionResult<{
        updateMutationFooEntity: {
          entity: { info: { updatedAt: string } };
        };
      }>;

      const { updatedAt: updatedAtString } = result.data!.updateMutationFooEntity.entity.info;

      expect(result).toEqual({
        data: {
          updateMutationFooEntity: {
            effect: 'updatedAndPublished',
            entity: {
              __typename: 'AdminMutationFoo',
              id,
              info: {
                type: 'MutationFoo',
                name,
                version: 2,
                authKey: '',
                status: EntityStatus.published,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAtString,
              },
              fields: {
                title: 'Updated title',
                summary: 'First summary',
                tags: ['one', 'two', 'three'],
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'MutationFoo',
          name,
          version: 2,
          authKey: '',
          status: EntityStatus.published,
          valid: true,
          validPublished: true,
          createdAt,
          updatedAt: new Date(updatedAtString),
        },
        fields: {
          ...emptyFooFields,
          title: 'Updated title',
          summary: 'First summary',
          tags: ['one', 'two', 'three'],
        },
      });
    }
  });

  test('Error: Update with the wrong type', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Name' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const result = await graphql({
        schema,
        source: gql`
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
            updateMutationFooEntity(entity: $entity) {
              entity {
                id
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: {
          entity: {
            id,
            info: {
              type: 'MutationBar', // should be Foo
              name: 'Foo name',
            },
            fields: {
              title: 'Foo title',
              summary: 'Foo summary',
            },
          },
        },
      });

      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "updateMutationFooEntity": null,
          },
          "errors": [
            [GraphQLError: BadRequest: Specified type (entity.info.type=MutationBar) should be MutationFoo],
          ],
        }
      `);
    }
  });

  test('Error: Update with the wrong authKey', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Name', authKey: 'subject' },
      fields: {},
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const result = await graphql({
        schema,
        source: gql`
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
            updateMutationFooEntity(entity: $entity) {
              entity {
                id
              }
            }
          }
        `,
        contextValue: createContext(),
        variableValues: {
          entity: {
            id,
            info: {
              name: 'Foo name',
              authKey: '', // Shouldn't be specified or be 'subject'
            },
            fields: {
              title: 'Foo title',
              summary: 'Foo summary',
            },
          },
        },
      });

      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "updateMutationFooEntity": null,
          },
          "errors": [
            [GraphQLError: BadRequest: entity.info.authKey: New authKey doesn’t correspond to previous authKey (!=subject)],
          ],
        }
      `);
    }
  });
});

describe('upsert*Entity()', () => {
  test('Create new entity', async () => {
    const { adminClient } = server;
    const id = insecureTestUuidv4();
    const entity: AdminEntityUpsert = {
      id,
      info: { type: 'MutationFoo', name: 'Name' },
      fields: { title: 'Title', summary: 'Summary', tags: ['one', 'two', 'three'] },
    };
    const result = (await graphql({
      schema,
      source: upsertMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: {
        entity,
      },
    })) as UpsertMutationFooGqlQueryResult;

    const { name, createdAt, updatedAt } = result.data!.upsertMutationFooEntity.entity.info;

    expect(result).toEqual({
      data: {
        upsertMutationFooEntity: {
          effect: 'created',
          entity: {
            __typename: 'AdminMutationFoo',
            id,
            info: {
              type: 'MutationFoo',
              name,
              version: 1,
              authKey: '',
              status: EntityStatus.draft,
              createdAt,
              updatedAt,
            },
            fields: {
              title: 'Title',
              summary: 'Summary',
              tags: ['one', 'two', 'three'],
            },
          },
        },
      },
    });

    const getResult = await adminClient.getEntity({ id });
    expectResultValue(getResult, {
      id,
      info: {
        type: 'MutationFoo',
        name,
        version: 1,
        authKey: '',
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
      fields: {
        ...emptyFooFields,
        title: 'Title',
        summary: 'Summary',
        tags: ['one', 'two', 'three'],
      },
    });
  });

  test('Update entity', async () => {
    const { adminClient } = server;

    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Foo' },
      fields: { title: 'Title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const result = (await graphql({
        schema,
        source: upsertMutationFooGqlQuery,
        contextValue: createContext(),
        variableValues: {
          entity: {
            id,
            info: { type: 'MutationFoo', name: 'Name' },
            fields: { title: 'Updated title' },
          },
        },
      })) as UpsertMutationFooGqlQueryResult;

      const { name, createdAt, updatedAt } = result.data!.upsertMutationFooEntity.entity.info;

      expect(result).toEqual({
        data: {
          upsertMutationFooEntity: {
            effect: 'updated',
            entity: {
              __typename: 'AdminMutationFoo',
              id,
              info: {
                type: 'MutationFoo',
                name,
                version: 2,
                authKey: '',
                status: EntityStatus.draft,
                createdAt,
                updatedAt,
              },
              fields: {
                title: 'Updated title',
                summary: null,
                tags: null,
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id });
      expectResultValue(getResult, {
        id,
        info: {
          type: 'MutationFoo',
          name,
          version: 2,
          authKey: '',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
        fields: {
          ...emptyFooFields,
          title: 'Updated title',
          summary: null,
          tags: null,
        },
      });
    }
  });

  test('Update entity (no change)', async () => {
    const { adminClient } = server;

    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Foo' },
      fields: { title: 'Title' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;
      const result = (await graphql({
        schema,
        source: upsertMutationFooGqlQuery,
        contextValue: createContext(),
        variableValues: {
          entity: {
            id,
            info: { type: 'MutationFoo', name: 'Foo' },
            fields: { title: 'Title' },
          },
        },
      })) as UpsertMutationFooGqlQueryResult;

      const { name, createdAt, updatedAt } = result.data!.upsertMutationFooEntity.entity.info;

      expect(result).toEqual({
        data: {
          upsertMutationFooEntity: {
            effect: 'none',
            entity: {
              __typename: 'AdminMutationFoo',
              id,
              info: {
                type: 'MutationFoo',
                name,
                version: 1,
                authKey: '',
                status: EntityStatus.draft,
                createdAt,
                updatedAt,
              },
              fields: {
                title: 'Title',
                summary: null,
                tags: null,
              },
            },
          },
        },
      });
    }
  });

  test('Create new entity and publish', async () => {
    const { adminClient } = server;
    const id = insecureTestUuidv4();
    const entity: AdminEntityUpsert = {
      id,
      info: { type: 'MutationFoo', name: 'Name' },
      fields: { title: 'Title', summary: 'Summary', tags: ['one', 'two', 'three'] },
    };
    const result = (await graphql({
      schema,
      source: upsertMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: {
        entity,
        publish: true,
      },
    })) as UpsertMutationFooGqlQueryResult;

    const { name, createdAt, updatedAt } = result.data!.upsertMutationFooEntity.entity.info;

    expect(result).toEqual({
      data: {
        upsertMutationFooEntity: {
          effect: 'createdAndPublished',
          entity: {
            __typename: 'AdminMutationFoo',
            id,
            info: {
              type: 'MutationFoo',
              name,
              version: 1,
              authKey: '',
              status: EntityStatus.published,
              createdAt,
              updatedAt,
            },
            fields: {
              title: 'Title',
              summary: 'Summary',
              tags: ['one', 'two', 'three'],
            },
          },
        },
      },
    });

    const getResult = await adminClient.getEntity({ id });
    expectResultValue(getResult, {
      id,
      info: {
        type: 'MutationFoo',
        name,
        version: 1,
        authKey: '',
        status: EntityStatus.published,
        valid: true,
        validPublished: true,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
      fields: {
        ...emptyFooFields,
        title: 'Title',
        summary: 'Summary',
        tags: ['one', 'two', 'three'],
      },
    });
  });

  test('Error: Upsert with the wrong type', async () => {
    const result = await graphql({
      schema,
      source: upsertMutationFooGqlQuery,
      contextValue: createContext(),
      variableValues: {
        entity: {
          id: insecureTestUuidv4(),
          info: {
            type: 'MutationBar', // should be Foo
            name: 'Foo name',
          },
          fields: {
            title: 'Foo title',
            summary: 'Foo summary',
          },
        },
      },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "upsertMutationFooEntity": null,
        },
        "errors": [
          [GraphQLError: BadRequest: Specified type (entity.info.type=MutationBar) should be MutationFoo],
        ],
      }
    `);
  });
});

describe('publishEntities()', () => {
  test('Publish', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = (await graphql({
        schema,
        source: gql`
          mutation PublishEntities($references: [EntityVersionReferenceInput!]!) {
            publishEntities(references: $references) {
              __typename
              id
              status
              effect
              updatedAt
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { references: [{ id, version: 1 }] },
      })) as ExecutionResult<{ publishEntities: { updatedAt: string }[] }>;
      const updatedAt = result.data!.publishEntities[0].updatedAt;
      expect(result).toEqual({
        data: {
          publishEntities: [
            {
              __typename: 'AdminEntityPublishPayload',
              id,
              status: EntityStatus.published,
              effect: 'published',
              updatedAt,
            },
          ],
        },
      });
    }
  });

  test('Error: not found', async () => {
    const result = await graphql({
      schema,
      source: gql`
        mutation PublishEntities($references: [EntityVersionReferenceInput!]!) {
          publishEntities(references: $references) {
            __typename
            id
            status
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { references: [{ id: '635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3', version: 1 }] },
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "publishEntities": null,
        },
        "errors": [
          [GraphQLError: NotFound: No such entities: 635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3],
        ],
      }
    `);
  });

  test('Error: using the wrong authKey', async () => {
    const { adminClientOther } = server;
    const createResult = await adminClientOther.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name', authKey: 'subject' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = await graphql({
        schema,
        source: gql`
          mutation PublishEntities($references: [EntityVersionReferenceInput!]!) {
            publishEntities(references: $references) {
              id
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { references: [{ id, version: 1 }] },
      });
      expect(result).toEqual({
        data: {
          publishEntities: null,
        },
        errors: [new Error(`NotAuthorized: entity(${id}): Wrong authKey provided`)],
      });
    }
  });
});

describe('unpublishEntities()', () => {
  test('Unpublish', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version: 1 }]));

      const result = (await graphql({
        schema,
        source: gql`
          mutation UnpublishEntities($references: [EntityReferenceInput!]!) {
            unpublishEntities(references: $references) {
              __typename
              id
              status
              effect
              updatedAt
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { references: [{ id }] },
      })) as ExecutionResult<{ unpublishEntities: { updatedAt: string }[] }>;
      const updatedAt = result.data!.unpublishEntities[0].updatedAt;
      expect(result).toEqual({
        data: {
          unpublishEntities: [
            {
              __typename: 'AdminEntityUnpublishPayload',
              id,
              status: EntityStatus.withdrawn,
              effect: 'unpublished',
              updatedAt,
            },
          ],
        },
      });
    }
  });

  test('Error: not found', async () => {
    const result = await graphql({
      schema,
      source: gql`
        mutation UnpublishEntities($references: [EntityReferenceInput!]!) {
          unpublishEntities(references: $references) {
            __typename
            id
            status
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { references: [{ id: '635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3' }] },
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "unpublishEntities": null,
        },
        "errors": [
          [GraphQLError: NotFound: No such entities: 635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3],
        ],
      }
    `);
  });

  test('Error: using the wrong authKey', async () => {
    const { adminClientOther } = server;
    const createResult = await adminClientOther.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name', authKey: 'subject' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = await graphql({
        schema,
        source: gql`
          mutation UnpublishEntities($references: [EntityReferenceInput!]!) {
            unpublishEntities(references: $references) {
              id
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { references: [{ id }] },
      });
      expect(result).toEqual({
        data: {
          unpublishEntities: null,
        },
        errors: [new Error(`NotAuthorized: entity(${id}): Wrong authKey provided`)],
      });
    }
  });
});

describe('archiveEntity()', () => {
  test('Archive', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = (await graphql({
        schema,
        source: gql`
          mutation ArchiveEntity($id: ID!) {
            archiveEntity(id: $id) {
              __typename
              id
              status
              effect
              updatedAt
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      })) as ExecutionResult<{ archiveEntity: { updatedAt: string } }>;
      const updatedAt = result.data!.archiveEntity.updatedAt;
      expect(result).toEqual({
        data: {
          archiveEntity: {
            __typename: 'AdminEntityArchivePayload',
            id,
            status: EntityStatus.archived,
            effect: 'archived',
            updatedAt,
          },
        },
      });
    }
  });

  test('Error: Wrong authKey', async () => {
    const { adminClientOther } = server;
    const createResult = await adminClientOther.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name', authKey: 'subject' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = await graphql({
        schema,
        source: gql`
          mutation ArchiveEntity($id: ID!) {
            archiveEntity(id: $id) {
              id
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "archiveEntity": null,
          },
          "errors": [
            [GraphQLError: NotAuthorized: Wrong authKey provided],
          ],
        }
      `);
    }
  });
});

describe('unarchiveEntity()', () => {
  test('Unarchive', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      expectOkResult(await adminClient.archiveEntity({ id }));

      const result = (await graphql({
        schema,
        source: gql`
          mutation UnarchiveEntity($id: ID!) {
            unarchiveEntity(id: $id) {
              __typename
              id
              status
              effect
              updatedAt
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      })) as ExecutionResult<{ unarchiveEntity: { updatedAt: string } }>;
      const updatedAt = result.data!.unarchiveEntity.updatedAt;
      expect(result).toEqual({
        data: {
          unarchiveEntity: {
            __typename: 'AdminEntityUnarchivePayload',
            id,
            status: EntityStatus.draft,
            effect: 'unarchived',
            updatedAt,
          },
        },
      });
    }
  });

  test('Error: not found', async () => {
    const result = await graphql({
      schema,
      source: gql`
        mutation UnarchiveEntity($id: ID!) {
          unarchiveEntity(id: $id) {
            __typename
            id
          }
        }
      `,
      contextValue: createContext(),
      variableValues: { id: '635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3' },
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "unarchiveEntity": null,
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
      info: { type: 'MutationFoo', name: 'Howdy name', authKey: 'subject' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = await graphql({
        schema,
        source: gql`
          mutation UnarchiveEntity($id: ID!) {
            unarchiveEntity(id: $id) {
              id
            }
          }
        `,
        contextValue: createContext(),
        variableValues: { id },
      });
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "unarchiveEntity": null,
          },
          "errors": [
            [GraphQLError: NotAuthorized: Wrong authKey provided],
          ],
        }
      `);
    }
  });
});

describe('Multiple', () => {
  test('Update and publish', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Howdy name' },
      fields: { title: 'Howdy title', summary: 'Howdy summary' },
    });
    if (expectOkResult(createResult)) {
      const {
        entity: { id },
      } = createResult.value;

      const result = await graphql({
        schema,
        source: gql`
          mutation UpdateAndPublishFooEntity(
            $entity: AdminMutationFooUpdateInput!
            $references: [EntityVersionReferenceInput!]!
          ) {
            updateMutationFooEntity(entity: $entity) {
              effect
              entity {
                fields {
                  title
                }
              }
            }

            publishEntities(references: $references) {
              id
              status
            }
          }
        `,
        contextValue: createContext(),
        variableValues: {
          entity: {
            id,
            fields: {
              title: 'Updated title',
            },
          },
          references: { id, version: 2 },
        },
      });
      expect(result).toEqual({
        data: {
          updateMutationFooEntity: {
            effect: 'updated',
            entity: { fields: { title: 'Updated title' } },
          },
          publishEntities: [{ id, status: EntityStatus.published }],
        },
      });
    }
  });
});
