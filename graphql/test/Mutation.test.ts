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
        { name: 'bar', type: EntityFieldType.Reference, entityTypes: ['MutationBar'] },
      ],
    },
    MutationBar: {
      fields: [],
    },
  });
  schema = new GraphQLSchemaGenerator(context.instance.getSchema()).buildSchema();
});
afterAll(async () => {
  await instance?.shutdown();
});

describe('create*Entity()', () => {
  test('Create', async () => {
    const result = await graphql(
      schema,
      `
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!, $publish: Boolean!) {
          createMutationFooEntity(entity: $entity, publish: $publish) {
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
      { context: ok(context) },
      {
        entity: {
          _type: 'MutationFoo',
          _name: 'Foo name',
          title: 'Foo title',
          summary: 'Foo summary',
        },
        publish: true,
      }
    );

    const id = result.data?.createMutationFooEntity.id;
    expect(result).toEqual({
      data: {
        createMutationFooEntity: {
          __typename: 'AdminMutationFoo',
          id,
          _type: 'MutationFoo',
          _name: 'Foo name',
          _version: 0,
          title: 'Foo title',
          summary: 'Foo summary',
        },
      },
    });

    const getResult = await EntityAdmin.getEntity(context, id, {});
    if (expectOkResult(getResult)) {
      expect(getResult.value.item).toEqual({
        id,
        _type: 'MutationFoo',
        _name: 'Foo name',
        _version: 0,
        title: 'Foo title',
        summary: 'Foo summary',
      });
    }
  });

  test('Create with reference', async () => {
    const createBarResult = await EntityAdmin.createEntity(
      context,
      { _type: 'MutationBar', _name: 'Bar' },
      { publish: true }
    );
    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;
      const gqlResult = await graphql(
        schema,
        `
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!, $publish: Boolean!) {
            createMutationFooEntity(entity: $entity, publish: $publish) {
              __typename
              id
              _type
              _name
              _version
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
        { context: ok(context) },
        {
          entity: {
            _type: 'MutationFoo',
            _name: 'Foo name',
            title: 'Foo title',
            summary: 'Foo summary',
            bar: { id: barId },
          },
          publish: true,
        }
      );

      const fooId = gqlResult.data?.createMutationFooEntity.id;
      expect(gqlResult).toEqual({
        data: {
          createMutationFooEntity: {
            __typename: 'AdminMutationFoo',
            id: fooId,
            _type: 'MutationFoo',
            _name: 'Foo name',
            _version: 0,
            title: 'Foo title',
            summary: 'Foo summary',
            bar: { id: barId, _name: 'Bar' },
          },
        },
      });

      const getResult = await EntityAdmin.getEntity(context, fooId, {});
      if (expectOkResult(getResult)) {
        expect(getResult.value.item).toEqual({
          id: fooId,
          _type: 'MutationFoo',
          _name: 'Foo name',
          _version: 0,
          title: 'Foo title',
          summary: 'Foo summary',
          bar: {
            id: barId,
          },
        });
      }
    }
  });
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
