import type { SchemaSpecification } from '@datadata/core';
import {
  CoreTestUtils,
  EntityPublishState,
  FieldType,
  ok,
  PublishingEventKind,
  RichTextBlockType,
} from '@datadata/core';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { v4 as uuidv4 } from 'uuid';
import type { SessionGraphQLContext } from '..';
import { GraphQLSchemaGenerator } from '..';
import type { TestServerWithSession } from './TestUtils';
import { expectResultValue, setUpServerWithSession } from './TestUtils';

const { expectOkResult } = CoreTestUtils;

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
  anyValueItem: null,
  anyValueItems: null,
};

const schemaSpecification: Partial<SchemaSpecification> = {
  entityTypes: [
    {
      name: 'MutationFoo',
      fields: [
        { name: 'title', type: FieldType.String, isName: true },
        { name: 'summary', type: FieldType.String },
        { name: 'tags', type: FieldType.String, list: true },
        { name: 'body', type: FieldType.RichText, entityTypes: ['MutationBar'] },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['MutationBar'] },
        {
          name: 'bars',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['MutationBar'],
        },
        { name: 'stringedBar', type: FieldType.ValueType, valueTypes: ['MutationStringedBar'] },
        { name: 'nestedValue', type: FieldType.ValueType, valueTypes: ['MutationNestedValue'] },
        { name: 'anyValueItem', type: FieldType.ValueType },
        { name: 'anyValueItems', type: FieldType.ValueType, list: true },
      ],
    },
    { name: 'MutationBar', fields: [] },
  ],
  valueTypes: [
    {
      name: 'MutationStringedBar',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['MutationBar'] },
      ],
    },
    {
      name: 'MutationNestedValue',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'child', type: FieldType.ValueType, valueTypes: ['MutationNestedValue'] },
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

describe('create*Entity()', () => {
  test('Create', async () => {
    const { adminClient } = server;
    const result = await graphql(
      schema,
      `
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
          createMutationFooEntity(entity: $entity) {
            __typename
            id
            _type
            _name
            _version
            _publishState
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
      `,
      undefined,
      createContext(),
      {
        entity: {
          _type: 'MutationFoo',
          _name: 'Foo name',
          title: 'Foo title',
          summary: 'Foo summary',
          tags: ['one', 'two', 'three'],
          location: { lat: 55.60498, lng: 13.003822 },
          locations: [
            { lat: 55.60498, lng: 13.003822 },
            { lat: 56.381561, lng: 13.99286 },
          ],
        },
      }
    );

    expect(result.errors).toBeUndefined();
    const id = result.data?.createMutationFooEntity.id;
    const name = result.data?.createMutationFooEntity._name;
    expect(name).toMatch(/^Foo name(#[0-9]+)?$/);

    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFoo',
          id,
          _type: 'MutationFoo',
          _name: name,
          _version: 0,
          _publishState: EntityPublishState.Draft,
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
    });

    const getResult = await adminClient.getEntity({ id });
    expectResultValue(getResult, {
      id,
      _type: 'MutationFoo',
      _name: name,
      _version: 0,
      _publishState: EntityPublishState.Draft,
      ...emptyFooFields,
      title: 'Foo title',
      summary: 'Foo summary',
      tags: ['one', 'two', 'three'],
      location: { lat: 55.60498, lng: 13.003822 },
      locations: [
        { lat: 55.60498, lng: 13.003822 },
        { lat: 56.381561, lng: 13.99286 },
      ],
    });
  });

  test('Create with ID', async () => {
    const id = uuidv4();
    const result = await graphql(
      schema,
      `
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
          createMutationFooEntity(entity: $entity) {
            __typename
            id
            _type
            _name
            _version
            _publishState
            title
          }
        }
      `,
      undefined,
      createContext(),
      {
        entity: {
          id,
          _type: 'MutationFoo',
          _name: 'Foo name',
          title: 'Foo title',
          summary: 'Foo summary',
        },
      }
    );

    const name = result.data?.createMutationFooEntity._name;
    expect(name).toMatch(/^Foo name(#[0-9]+)?$/);

    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFoo',
          id,
          _type: 'MutationFoo',
          _name: name,
          _version: 0,
          _publishState: EntityPublishState.Draft,
          title: 'Foo title',
        },
      },
    });
  });

  test('Create with rich text with reference', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar' },
    });
    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;
      const gqlResult = await graphql(
        schema,
        `
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              __typename
              id
              _type
              _name
              _version
              _publishState
              title
              summary
              body {
                blocksJson
              }
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            _type: 'MutationFoo',
            _name: 'Foo name',
            title: 'Foo title',
            summary: 'Foo summary',
            body: {
              blocksJson: JSON.stringify([
                { type: RichTextBlockType.paragraph, data: { text: 'Hello world' } },
                { type: RichTextBlockType.entity, data: { id: barId } },
              ]),
            },
          },
        }
      );

      const fooId = gqlResult.data?.createMutationFooEntity.id;
      const fooName = gqlResult.data?.createMutationFooEntity._name;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            __typename: 'AdminMutationFoo',
            id: fooId,
            _type: 'MutationFoo',
            _name: fooName,
            _version: 0,
            _publishState: EntityPublishState.Draft,
            title: 'Foo title',
            summary: 'Foo summary',
            body: {
              blocksJson: `[{"type":"paragraph","data":{"text":"Hello world"}},{"type":"entity","data":{"id":"${barId}"}}]`,
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        _type: 'MutationFoo',
        _name: fooName,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Foo title',
        summary: 'Foo summary',
        body: {
          blocks: [
            { type: RichTextBlockType.paragraph, data: { text: 'Hello world' } },
            { type: RichTextBlockType.entity, data: { id: barId } },
          ],
        },
      });
    }
  });

  test('Create with reference', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        id: barId,
        info: { name: barName },
      } = createBarResult.value;
      const gqlResult = await graphql(
        schema,
        `
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              __typename
              id
              _type
              _name
              _version
              _publishState
              title
              summary
              bar {
                id
                _name
              }
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            _type: 'MutationFoo',
            _name: 'Foo name',
            title: 'Foo title',
            summary: 'Foo summary',
            bar: { id: barId },
          },
        }
      );

      const fooId = gqlResult.data?.createMutationFooEntity.id;
      const fooName = gqlResult.data?.createMutationFooEntity._name;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            __typename: 'AdminMutationFoo',
            id: fooId,
            _type: 'MutationFoo',
            _name: fooName,
            _version: 0,
            _publishState: EntityPublishState.Draft,
            title: 'Foo title',
            summary: 'Foo summary',
            bar: { id: barId, _name: barName },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        _type: 'MutationFoo',
        _name: fooName,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Foo title',
        summary: 'Foo summary',
        bar: {
          id: barId,
        },
      });
    }
  });

  test('Create with reference list', async () => {
    const { adminClient } = server;
    const createBar1Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 1' },
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 2' },
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        id: bar1Id,
        info: { name: bar1Name },
      } = createBar1Result.value;
      const {
        id: bar2Id,
        info: { name: bar2Name },
      } = createBar2Result.value;

      const gqlResult = await graphql(
        schema,
        `
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              __typename
              id
              _type
              _name
              _version
              title
              summary
              bars {
                id
                _name
              }
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            _type: 'MutationFoo',
            _name: 'Foo name',
            title: 'Foo title',
            summary: 'Foo summary',
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
        }
      );

      const fooId = gqlResult.data?.createMutationFooEntity.id;
      const fooName = gqlResult.data?.createMutationFooEntity._name;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            __typename: 'AdminMutationFoo',
            id: fooId,
            _type: 'MutationFoo',
            _name: fooName,
            _version: 0,
            title: 'Foo title',
            summary: 'Foo summary',
            bars: [
              { id: bar1Id, _name: bar1Name },
              { id: bar2Id, _name: bar2Name },
            ],
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        _type: 'MutationFoo',
        _name: fooName,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Foo title',
        summary: 'Foo summary',
        bars: [{ id: bar1Id }, { id: bar2Id }],
      });
    }
  });

  test('Create with value type with reference', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar' },
    });
    if (expectOkResult(createBarResult)) {
      const {
        id: barId,
        info: { name: barName },
      } = createBarResult.value;
      const gqlResult = await graphql(
        schema,
        `
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              __typename
              id
              _type
              _name
              _version
              title
              summary
              stringedBar {
                __typename
                _type
                text
                bar {
                  __typename
                  _type
                  id
                  _name
                }
              }
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            _type: 'MutationFoo',
            _name: 'Foo name',
            title: 'Foo title',
            summary: 'Foo summary',
            stringedBar: {
              _type: 'MutationStringedBar',
              text: 'Value text',
              bar: { id: barId },
            },
          },
        }
      );

      const fooId = gqlResult.data?.createMutationFooEntity.id;
      const fooName = gqlResult.data?.createMutationFooEntity._name;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            __typename: 'AdminMutationFoo',
            id: fooId,
            _type: 'MutationFoo',
            _name: fooName,
            _version: 0,
            title: 'Foo title',
            summary: 'Foo summary',
            stringedBar: {
              __typename: 'AdminMutationStringedBar',
              _type: 'MutationStringedBar',
              text: 'Value text',
              bar: {
                __typename: 'AdminMutationBar',
                _type: 'MutationBar',
                id: barId,
                _name: barName,
              },
            },
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        _type: 'MutationFoo',
        _name: fooName,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Foo title',
        summary: 'Foo summary',
        stringedBar: {
          _type: 'MutationStringedBar',
          text: 'Value text',
          bar: { id: barId },
        },
      });
    }
  });

  test('Create with value JSON', async () => {
    const { adminClient } = server;
    const createBarResult = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar' },
    });

    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;

      const createFooResult = await graphql(
        schema,
        `
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
            createMutationFooEntity(entity: $entity) {
              __typename
              id
              _type
              _name
              _version
              anyValueItem {
                __typename
                _type
              }
              anyValueItems {
                __typename
                _type
              }
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            _type: 'MutationFoo',
            _name: 'Foo name',
            anyValueItemJson: JSON.stringify({
              _type: 'MutationStringedBar',
              text: 'A value',
              bar: { id: barId },
            }),
            anyValueItemsJson: JSON.stringify([
              {
                _type: 'MutationStringedBar',
                text: 'A value in a list',
                bar: { id: barId },
              },
            ]),
          },
          publish: true,
        }
      );

      const fooId = createFooResult.data?.createMutationFooEntity.id;
      const fooName = createFooResult.data?.createMutationFooEntity._name;

      expect(createFooResult).toEqual({
        data: {
          createMutationFooEntity: {
            __typename: 'AdminMutationFoo',
            id: fooId,
            _type: 'MutationFoo',
            _name: fooName,
            _version: 0,
            anyValueItem: {
              __typename: 'AdminMutationStringedBar',
              _type: 'MutationStringedBar',
            },
            anyValueItems: [
              {
                __typename: 'AdminMutationStringedBar',
                _type: 'MutationStringedBar',
              },
            ],
          },
        },
      });

      const getResult = await adminClient.getEntity({ id: fooId });
      expectResultValue(getResult, {
        id: fooId,
        _type: 'MutationFoo',
        _name: fooName,
        _version: 0,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        anyValueItem: {
          _type: 'MutationStringedBar',
          text: 'A value',
          bar: { id: barId },
        },
        anyValueItems: [
          {
            _type: 'MutationStringedBar',
            text: 'A value in a list',
            bar: { id: barId },
          },
        ],
      });
    }
  });

  test('Create nested value item with inner JSON', async () => {
    const { adminClient } = server;
    const createResult = await graphql(
      schema,
      `
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
          createMutationFooEntity(entity: $entity) {
            __typename
            id
            _type
            _name
            _version
            nestedValue {
              __typename
              _type
              text
              child {
                __typename
                _type
                text
                child {
                  __typename
                  _type
                  text
                }
              }
            }
          }
        }
      `,
      undefined,
      createContext(),
      {
        entity: {
          _type: 'MutationFoo',
          _name: 'Foo name',
          nestedValue: {
            _type: 'MutationNestedValue',
            text: 'Outer',
            childJson: JSON.stringify({
              _type: 'MutationNestedValue',
              text: 'Inner',
            }),
          },
        },
      }
    );

    const fooId = createResult.data?.createMutationFooEntity.id;
    const fooName = createResult.data?.createMutationFooEntity._name;

    expect(createResult).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFoo',
          id: fooId,
          _type: 'MutationFoo',
          _name: fooName,
          _version: 0,
          nestedValue: {
            __typename: 'AdminMutationNestedValue',
            _type: 'MutationNestedValue',
            text: 'Outer',
            child: {
              __typename: 'AdminMutationNestedValue',
              _type: 'MutationNestedValue',
              text: 'Inner',
              child: null,
            },
          },
        },
      },
    });

    const getResult = await adminClient.getEntity({ id: fooId });
    expectResultValue(getResult, {
      id: fooId,
      _type: 'MutationFoo',
      _name: fooName,
      _version: 0,
      _publishState: EntityPublishState.Draft,
      ...emptyFooFields,
      nestedValue: {
        _type: 'MutationNestedValue',
        text: 'Outer',
        child: { _type: 'MutationNestedValue', text: 'Inner' },
      },
    });
  });

  test('Create without specifying _type', async () => {
    const result = await graphql(
      schema,
      `
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
          createMutationFooEntity(entity: $entity) {
            __typename
            id
            _type
            _name
            _version
            title
            summary
          }
        }
      `,
      undefined,
      createContext(),
      {
        entity: {
          _name: 'Foo name',
          title: 'Foo title',
          summary: 'Foo summary',
        },
      }
    );

    const id = result.data?.createMutationFooEntity.id;
    const name = result.data?.createMutationFooEntity._name;
    expect(name).toMatch(/^Foo name(#[0-9]+)?$/);

    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFoo',
          id,
          _type: 'MutationFoo',
          _name: name,
          _version: 0,
          title: 'Foo title',
          summary: 'Foo summary',
        },
      },
    });
  });

  test('Error: Create with the wrong _type', async () => {
    const result = await graphql(
      schema,
      `
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!) {
          createMutationFooEntity(entity: $entity) {
            id
          }
        }
      `,
      undefined,
      createContext(),
      {
        entity: {
          _type: 'MutationBar', // should be Foo
          _name: 'Foo name',
          title: 'Foo title',
          summary: 'Foo summary',
        },
      }
    );

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "createMutationFooEntity": null,
        },
        "errors": Array [
          [GraphQLError: BadRequest: Specified type (entity._type=MutationBar) should be MutationFoo],
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
        id,
        info: { name },
      } = createResult.value;
      const result = await graphql(
        schema,
        `
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
            updateMutationFooEntity(entity: $entity) {
              __typename
              id
              _type
              _name
              _version
              _publishState
              title
              summary
              tags
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            id,
            title: 'Updated title',
          },
        }
      );

      expect(result).toEqual({
        data: {
          updateMutationFooEntity: {
            __typename: 'AdminMutationFoo',
            id,
            _type: 'MutationFoo',
            _name: name,
            _version: 1,
            _publishState: EntityPublishState.Draft,
            title: 'Updated title',
            summary: 'First summary',
            tags: ['one', 'two', 'three'],
          },
        },
      });

      const getResult = await adminClient.getEntity({ id });
      expectResultValue(getResult, {
        id,
        _type: 'MutationFoo',
        _name: name,
        _version: 1,
        _publishState: EntityPublishState.Draft,
        ...emptyFooFields,
        title: 'Updated title',
        summary: 'First summary',
        tags: ['one', 'two', 'three'],
      });
    }
  });

  test('Update with all values including references', async () => {
    const { adminClient } = server;
    const createBar1Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 1' },
    });
    const createBar2Result = await adminClient.createEntity({
      info: { type: 'MutationBar', name: 'Bar 2' },
    });
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const {
        id: bar1Id,
        info: { name: bar1Name },
      } = createBar1Result.value;
      const {
        id: bar2Id,
        info: { name: bar2Name },
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
        const { id: fooId } = createFooResult.value;
        const result = await graphql(
          schema,
          `
            mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
              updateMutationFooEntity(entity: $entity) {
                __typename
                id
                _type
                _name
                _version
                title
                summary
                tags
                bar {
                  __typename
                  id
                  _type
                  _name
                }
                bars {
                  __typename
                  id
                  _type
                  _name
                }
                stringedBar {
                  __typename
                  _type
                  text
                  bar {
                    __typename
                    id
                  }
                }
                anyValueItem {
                  __typename
                  _type
                }
                anyValueItems {
                  __typename
                  _type
                }
              }
            }
          `,
          undefined,
          createContext(),
          {
            entity: {
              id: fooId,
              _type: 'MutationFoo',
              _name: 'Updated name',
              title: 'Updated title',
              summary: 'Updated summary',
              tags: ['these', 'are', 'new'],
              bar: { id: bar1Id },
              bars: [{ id: bar1Id }, { id: bar2Id }],
              stringedBar: {
                _type: 'MutationStringedBar',
                text: 'Value text',
                bar: { id: bar2Id },
              },
              anyValueItemJson: JSON.stringify({
                _type: 'MutationStringedBar',
                text: 'A value item',
                bar: { id: bar1Id },
              }),
              anyValueItemsJson: JSON.stringify([
                {
                  _type: 'MutationStringedBar',
                  text: 'A value item in a list',
                  bar: { id: bar2Id },
                },
              ]),
            },
          }
        );

        expect(result.errors).toBeFalsy();
        const name = result.data?.updateMutationFooEntity._name;
        expect(name).toMatch(/^Updated name(#[0-9]+)?$/);

        expect(result).toEqual({
          data: {
            updateMutationFooEntity: {
              __typename: 'AdminMutationFoo',
              id: fooId,
              _type: 'MutationFoo',
              _name: name,
              _version: 1,
              title: 'Updated title',
              summary: 'Updated summary',
              tags: ['these', 'are', 'new'],
              bar: {
                __typename: 'AdminMutationBar',
                id: bar1Id,
                _type: 'MutationBar',
                _name: bar1Name,
              },
              bars: [
                {
                  __typename: 'AdminMutationBar',
                  id: bar1Id,
                  _type: 'MutationBar',
                  _name: bar1Name,
                },
                {
                  __typename: 'AdminMutationBar',
                  id: bar2Id,
                  _type: 'MutationBar',
                  _name: bar2Name,
                },
              ],
              stringedBar: {
                __typename: 'AdminMutationStringedBar',
                _type: 'MutationStringedBar',
                text: 'Value text',
                bar: {
                  __typename: 'AdminMutationBar',
                  id: bar2Id,
                },
              },
              anyValueItem: {
                __typename: 'AdminMutationStringedBar',
                _type: 'MutationStringedBar',
              },
              anyValueItems: [
                {
                  __typename: 'AdminMutationStringedBar',
                  _type: 'MutationStringedBar',
                },
              ],
            },
          },
        });

        const getResult = await adminClient.getEntity({ id: fooId });
        expectResultValue(getResult, {
          id: fooId,
          _type: 'MutationFoo',
          _name: name,
          _version: 1,
          _publishState: EntityPublishState.Draft,
          ...emptyFooFields,
          title: 'Updated title',
          summary: 'Updated summary',
          tags: ['these', 'are', 'new'],
          bar: { id: bar1Id },
          bars: [{ id: bar1Id }, { id: bar2Id }],
          stringedBar: {
            _type: 'MutationStringedBar',
            text: 'Value text',
            bar: { id: bar2Id },
          },
          anyValueItem: {
            _type: 'MutationStringedBar',
            text: 'A value item',
            bar: { id: bar1Id },
          },
          anyValueItems: [
            {
              _type: 'MutationStringedBar',
              text: 'A value item in a list',
              bar: { id: bar2Id },
            },
          ],
        });
      }
    }
  });

  test('Error: Update with the wrong _type', async () => {
    const { adminClient } = server;
    const createResult = await adminClient.createEntity({
      info: { type: 'MutationFoo', name: 'Name' },
    });
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const result = await graphql(
        schema,
        `
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!) {
            updateMutationFooEntity(entity: $entity) {
              id
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            id,
            _type: 'MutationBar', // should be Foo
            _name: 'Foo name',
            title: 'Foo title',
            summary: 'Foo summary',
          },
        }
      );

      expect(result).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "updateMutationFooEntity": null,
          },
          "errors": Array [
            [GraphQLError: BadRequest: Specified type (entity._type=MutationBar) should be MutationFoo],
          ],
        }
      `);
    }
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
      const { id } = createResult.value;

      const result = await graphql(
        schema,
        `
          mutation PublishEntities($entities: [EntityVersionInput!]!) {
            publishEntities(entities: $entities) {
              __typename
              id
              publishState
            }
          }
        `,
        undefined,
        createContext(),
        { entities: [{ id, version: 0 }] }
      );
      expect(result).toEqual({
        data: {
          publishEntities: [
            {
              __typename: 'EntityPublishPayload',
              id,
              publishState: EntityPublishState.Published,
            },
          ],
        },
      });

      const historyResult = await adminClient.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const publishedAt = historyResult.value.events[0]?.publishedAt;
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Publish,
              publishedAt,
              publishedBy: server.subjectId,
              version: 0,
            },
          ],
        });
      }
    }
  });

  test('Error: not found', async () => {
    const result = await graphql(
      schema,
      `
        mutation PublishEntities($entities: [EntityVersionInput!]!) {
          publishEntities(entities: $entities) {
            __typename
            id
            publishState
          }
        }
      `,
      undefined,
      createContext(),
      { entities: [{ id: '635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3', version: 0 }] }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "publishEntities": null,
        },
        "errors": Array [
          [GraphQLError: NotFound: No such entities: 635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3],
        ],
      }
    `);
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
      const { id } = createResult.value;

      expectOkResult(await adminClient.publishEntities([{ id, version: 0 }]));

      const result = await graphql(
        schema,
        `
          mutation UnpublishEntities($ids: [ID!]!) {
            unpublishEntities(ids: $ids) {
              __typename
              id
              publishState
            }
          }
        `,
        undefined,
        createContext(),
        { ids: [id] }
      );
      expect(result).toEqual({
        data: {
          unpublishEntities: [
            {
              __typename: 'EntityPublishPayload',
              id,
              publishState: EntityPublishState.Withdrawn,
            },
          ],
        },
      });

      const historyResult = await adminClient.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const publishedAt0 = historyResult.value.events[0]?.publishedAt;
        const publishedAt1 = historyResult.value.events[1]?.publishedAt;
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Publish,
              publishedAt: publishedAt0,
              publishedBy: server.subjectId,
              version: 0,
            },
            {
              kind: PublishingEventKind.Unpublish,
              publishedAt: publishedAt1,
              publishedBy: server.subjectId,
              version: null,
            },
          ],
        });
      }
    }
  });

  test('Error: not found', async () => {
    const result = await graphql(
      schema,
      `
        mutation UnpublishEntities($ids: [ID!]!) {
          unpublishEntities(ids: $ids) {
            __typename
            id
            publishState
          }
        }
      `,
      undefined,
      createContext(),
      { ids: ['635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3'] }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "unpublishEntities": null,
        },
        "errors": Array [
          [GraphQLError: NotFound: No such entities: 635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3],
        ],
      }
    `);
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
      const { id } = createResult.value;

      const result = await graphql(
        schema,
        `
          mutation ArchiveEntity($id: ID!) {
            archiveEntity(id: $id) {
              __typename
              id
              publishState
            }
          }
        `,
        undefined,
        createContext(),
        { id }
      );
      expect(result).toEqual({
        data: {
          archiveEntity: {
            __typename: 'EntityPublishPayload',
            id,
            publishState: EntityPublishState.Archived,
          },
        },
      });

      const historyResult = await adminClient.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const publishedAt = historyResult.value.events[0]?.publishedAt;
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Archive,
              publishedAt,
              publishedBy: server.subjectId,
              version: null,
            },
          ],
        });
      }
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
      const { id } = createResult.value;

      expectOkResult(await adminClient.archiveEntity({ id }));

      const result = await graphql(
        schema,
        `
          mutation UnarchiveEntity($id: ID!) {
            unarchiveEntity(id: $id) {
              __typename
              id
              publishState
            }
          }
        `,
        undefined,
        createContext(),
        { id }
      );
      expect(result).toEqual({
        data: {
          unarchiveEntity: {
            __typename: 'EntityPublishPayload',
            id,
            publishState: EntityPublishState.Draft,
          },
        },
      });

      const historyResult = await adminClient.getPublishingHistory({ id });
      if (expectOkResult(historyResult)) {
        const publishedAt0 = historyResult.value.events[0]?.publishedAt;
        const publishedAt1 = historyResult.value.events[1]?.publishedAt;
        expectResultValue(historyResult, {
          id,
          events: [
            {
              kind: PublishingEventKind.Archive,
              publishedAt: publishedAt0,
              publishedBy: server.subjectId,
              version: null,
            },
            {
              kind: PublishingEventKind.Unarchive,
              publishedAt: publishedAt1,
              publishedBy: server.subjectId,
              version: null,
            },
          ],
        });
      }
    }
  });

  test('Error: not found', async () => {
    const result = await graphql(
      schema,
      `
        mutation UnarchiveEntity($id: ID!) {
          unarchiveEntity(id: $id) {
            __typename
            id
          }
        }
      `,
      undefined,
      createContext(),
      { id: '635d7ee9-c1c7-4ae7-bcdf-fb53f30a3cd3' }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "unarchiveEntity": null,
        },
        "errors": Array [
          [GraphQLError: NotFound: No such entity],
        ],
      }
    `);
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
      const { id } = createResult.value;

      const result = await graphql(
        schema,
        `
          mutation UpdateAndPublishFooEntity(
            $entity: AdminMutationFooUpdateInput!
            $entities: [EntityVersionInput!]!
          ) {
            updateMutationFooEntity(entity: $entity) {
              title
            }

            publishEntities(entities: $entities) {
              id
              publishState
            }
          }
        `,
        undefined,
        createContext(),
        {
          entity: {
            id,
            title: 'Updated title',
          },
          entities: { id, version: 1 },
        }
      );
      expect(result).toEqual({
        data: {
          updateMutationFooEntity: { title: 'Updated title' },
          publishEntities: [{ id, publishState: EntityPublishState.Published }],
        },
      });

      const historyResult = await adminClient.getEntityHistory({ id });
      if (expectOkResult(historyResult)) {
        expect(historyResult.value.versions).toHaveLength(2);
        expect(historyResult.value.versions[1].published).toBeTruthy();
      }
    }
  });
});
