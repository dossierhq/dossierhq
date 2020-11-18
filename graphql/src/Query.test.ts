import { EntityAdmin, EntityFieldType, TestUtils } from '@datadata/core';
import type { Instance, SessionContext } from '@datadata/core';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from './GraphQLSchemaGenerator';

const { createTestInstance, ensureSessionContext, expectOkResult, updateSchema } = TestUtils;

let instance: Instance;
let context: SessionContext;
let schema: GraphQLSchema;

beforeAll(async () => {
  instance = await createTestInstance({ loadSchema: true });
  context = await ensureSessionContext(instance, 'test', 'query');
  await updateSchema(context, {
    QueryFoo: {
      fields: [
        { name: 'title', type: EntityFieldType.String, isName: true },
        { name: 'summary', type: EntityFieldType.String },
      ],
    },
    QueryBar: { fields: [{ name: 'title', type: EntityFieldType.String }] },
  });
  schema = new GraphQLSchemaGenerator(context.instance.getSchema()).buildSchema();
});
afterAll(async () => {
  await instance?.shutdown();
});

describe('Hello', () => {
  test('QueryFoo', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'QueryFoo', _name: 'Howdy name', title: 'Howdy title', summary: 'Howdy summary' },
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
              }
            }
          }
        `,
        undefined,
        { context },
        { id }
      );
      expect(result).toEqual({
        data: {
          node: {
            __typename: 'QueryFoo',
            id,
            _name: 'Howdy name',
            title: 'Howdy title',
            summary: 'Howdy summary',
          },
        },
      });
    }
  });
});
