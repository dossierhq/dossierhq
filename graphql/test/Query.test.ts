import { CoreTestUtils, FieldType, notOk, ok } from '@datadata/core';
import { EntityAdmin, ServerTestUtils } from '@datadata/server';
import type { Server, SessionContext } from '@datadata/server';
import { graphql, printError } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

const { expectOkResult } = CoreTestUtils;
const { createTestServer, ensureSessionContext, updateSchema } = ServerTestUtils;

let server: Server;
let context: SessionContext;
let schema: GraphQLSchema;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'query');
  await updateSchema(context, {
    entityTypes: [
      {
        name: 'QueryFoo',
        fields: [
          { name: 'title', type: FieldType.String, isName: true },
          { name: 'summary', type: FieldType.String },
          { name: 'tags', type: FieldType.String, list: true },
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
                bars {
                  id
                }
                tags
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
            stringedBar: null,
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

  test('Query value type', async () => {
    const createBarResult = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryBar', _name: 'Bar name', title: 'Bar title' },
      { publish: true }
    );
    if (expectOkResult(createBarResult)) {
      const barId = createBarResult.value.id;

      const createFooResult = await EntityAdmin.createEntity(
        context,
        {
          _type: 'QueryFoo',
          _name: 'Foo name',
          title: 'Foo title',
          stringedBar: { _type: 'QueryStringedBar', text: 'Value text', bar: { id: barId } },
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
    const createFoo1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryFoo', _name: 'Howdy name 1' },
      { publish: true }
    );
    const createFoo2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryFoo', _name: 'Howdy name 2' },
      { publish: true }
    );
    if (expectOkResult(createFoo1Result) && expectOkResult(createFoo2Result)) {
      const { id: foo1Id, _name: foo1Name } = createFoo1Result.value;
      const { id: foo2Id, _name: foo2Name } = createFoo2Result.value;

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
