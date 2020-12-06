import { EntityAdmin, EntityFieldType, notOk, ok, TestUtils } from '@datadata/core';
import type { Instance, SessionContext } from '@datadata/core';
import { graphql, printError } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

const { createTestInstance, ensureSessionContext, expectOkResult, updateSchema } = TestUtils;

let instance: Instance;
let context: SessionContext;
let schema: GraphQLSchema;

beforeAll(async () => {
  instance = await createTestInstance();
  context = await ensureSessionContext(instance, 'test', 'query');
  await updateSchema(context, {
    entityTypes: {
      QueryFoo: {
        fields: [
          { name: 'title', type: EntityFieldType.String, isName: true },
          { name: 'summary', type: EntityFieldType.String },
          { name: 'tags', type: EntityFieldType.String, list: true },
          { name: 'bar', type: EntityFieldType.Reference, entityTypes: ['QueryBar'] },
          { name: 'bars', type: EntityFieldType.Reference, entityTypes: ['QueryBar'], list: true },
        ],
      },
      QueryBar: { fields: [{ name: 'title', type: EntityFieldType.String }] },
    },
  });
  schema = new GraphQLSchemaGenerator(context.instance.getSchema()).buildSchema();
});
afterAll(async () => {
  await instance?.shutdown();
});

describe('node()', () => {
  test('Query all fields of created entity', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'QueryFoo',
        _name: 'Howdy name',
        title: 'Howdy title',
        summary: 'Howdy summary',
        tags: ['one', 'two', 'three'],
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

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
          },
        },
      });
    }
  });

  test('Query null fields of created entity', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryFoo', _name: 'Howdy name' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

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
                tags
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
            tags: null,
          },
        },
      });
    }
  });

  test('Query referenced entity', async () => {
    const createBarResult = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryBar', _name: 'Bar name', title: 'Bar title' },
      { publish: true }
    );
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await EntityAdmin.createEntity(
        context,
        { _type: 'QueryFoo', _name: 'Foo name', title: 'Foo title', bar: { id: barId } },
        { publish: true }
      );
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

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
    const createBar1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryBar', _name: 'Bar 1 name', title: 'Bar 1 title' },
      { publish: true }
    );
    const createBar2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryBar', _name: 'Bar 2 name', title: 'Bar 2 title' },
      { publish: true }
    );
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const bar1Id = createBar1Result.value.id;
      const bar2Id = createBar2Result.value.id;

      const createFooResult = await EntityAdmin.createEntity(
        context,
        {
          _type: 'QueryFoo',
          _name: 'Foo name',
          title: 'Foo title',
          bars: [{ id: bar1Id }, { id: bar2Id }],
        },
        { publish: true }
      );
      if (expectOkResult(createFooResult)) {
        const fooId = createFooResult.value.id;

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
