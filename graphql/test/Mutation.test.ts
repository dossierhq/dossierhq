import { EntityAdmin, EntityFieldType, ok, TestUtils } from '@datadata/core';
import type { Instance, SessionContext } from '@datadata/core';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

const { createTestInstance, ensureSessionContext, expectOkResult, updateSchema } = TestUtils;

let instance: Instance;
let context: SessionContext;
let schema: GraphQLSchema;

beforeAll(async () => {
  instance = await createTestInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'mutation');
  await updateSchema(context, {
    MutationFoo: {
      fields: [
        { name: 'title', type: EntityFieldType.String, isName: true },
        { name: 'summary', type: EntityFieldType.String },
      ],
    },
  });
  schema = new GraphQLSchemaGenerator(context.instance.getSchema()).buildSchema();
});
afterAll(async () => {
  await instance?.shutdown();
});

describe('deleteEntity()', () => {
  test('Delete and publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'MutationFoo',
        _name: 'Howdy name',
        title: 'Howdy title',
        summary: 'Howdy summary',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const result = await graphql(
        schema,
        `
          mutation DeleteEntity($id: ID!, $publish: Boolean!) {
            deleteEntity(id: $id, publish: $publish) {
              __typename
              id
              _type
              _name
              _version
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id, publish: true }
      );
      expect(result).toEqual({
        data: {
          deleteEntity: {
            __typename: 'AdminMutationFoo',
            id,
            _type: 'MutationFoo',
            _name: 'Howdy name',
            _version: 1,
          },
        },
      });
    }
  });

  test('Delete w/o publish', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'MutationFoo',
        _name: 'Howdy name',
        title: 'Howdy title',
        summary: 'Howdy summary',
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;

      const result = await graphql(
        schema,
        `
          mutation DeleteEntity($id: ID!, $publish: Boolean!) {
            deleteEntity(id: $id, publish: $publish) {
              __typename
              id
              _type
              _name
              _version
            }
          }
        `,
        undefined,
        { context: ok(context) },
        { id, publish: false }
      );
      expect(result).toEqual({
        data: {
          deleteEntity: {
            __typename: 'AdminMutationFoo',
            id,
            _type: 'MutationFoo',
            _name: 'Howdy name',
            _version: 1,
          },
        },
      });
    }
  });
});
