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
  instance = await createTestInstance();
  context = await ensureSessionContext(instance, 'test', 'mutation');
  await updateSchema(context, {
    MutationFoo: {
      fields: [
        { name: 'title', type: EntityFieldType.String, isName: true },
        { name: 'summary', type: EntityFieldType.String },
        { name: 'tags', type: EntityFieldType.String, list: true },
        { name: 'bar', type: EntityFieldType.Reference, entityTypes: ['MutationBar'] },
        { name: 'bars', type: EntityFieldType.Reference, list: true, entityTypes: ['MutationBar'] },
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
            tags
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
          tags: ['one', 'two', 'three'],
        },
        publish: true,
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
          tags: ['one', 'two', 'three'],
        },
      },
    });

    const getResult = await EntityAdmin.getEntity(context, id, {});
    if (expectOkResult(getResult)) {
      expect(getResult.value.item).toEqual({
        id,
        _type: 'MutationFoo',
        _name: name,
        _version: 0,
        title: 'Foo title',
        summary: 'Foo summary',
        tags: ['one', 'two', 'three'],
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
      const { id: barId, _name: barName } = createBarResult.value;
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
            bar: { id: barId, _name: barName },
          },
        },
      });

      const getResult = await EntityAdmin.getEntity(context, fooId, {});
      if (expectOkResult(getResult)) {
        expect(getResult.value.item).toEqual({
          id: fooId,
          _type: 'MutationFoo',
          _name: fooName,
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

  test('Create with reference list', async () => {
    const createBar1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'MutationBar', _name: 'Bar 1' },
      { publish: true }
    );
    const createBar2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'MutationBar', _name: 'Bar 2' },
      { publish: true }
    );
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id, _name: bar1Name } = createBar1Result.value;
      const { id: bar2Id, _name: bar2Name } = createBar2Result.value;

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
              bars {
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
            bars: [{ id: bar1Id }, { id: bar2Id }],
          },
          publish: true,
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

      const getResult = await EntityAdmin.getEntity(context, fooId, {});
      if (expectOkResult(getResult)) {
        expect(getResult.value.item).toEqual({
          id: fooId,
          _type: 'MutationFoo',
          _name: fooName,
          _version: 0,
          title: 'Foo title',
          summary: 'Foo summary',
          bars: [{ id: bar1Id }, { id: bar2Id }],
        });
      }
    }
  });

  test('Create without specifying _type', async () => {
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
          _name: 'Foo name',
          title: 'Foo title',
          summary: 'Foo summary',
        },
        publish: true,
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
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!, $publish: Boolean!) {
          createMutationFooEntity(entity: $entity, publish: $publish) {
            id
          }
        }
      `,
      undefined,
      { context: ok(context) },
      {
        entity: {
          _type: 'MutationBar', // should be Foo
          _name: 'Foo name',
          title: 'Foo title',
          summary: 'Foo summary',
        },
        publish: true,
      }
    );

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": null,
        "errors": Array [
          [GraphQLError: BadRequest: Specified type (entity._type=MutationBar) should be MutationFoo],
        ],
      }
    `);
  });
});

describe('update*Entity()', () => {
  test('Update minimal', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      {
        _type: 'MutationFoo',
        _name: 'First name',
        title: 'First title',
        summary: 'First summary',
        tags: ['one', 'two', 'three'],
      },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id, _name: name } = createResult.value;
      const result = await graphql(
        schema,
        `
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!, $publish: Boolean!) {
            updateMutationFooEntity(entity: $entity, publish: $publish) {
              __typename
              id
              _type
              _name
              _version
              title
              summary
              tags
            }
          }
        `,
        undefined,
        { context: ok(context) },
        {
          entity: {
            id,
            title: 'Updated title',
          },
          publish: true,
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
            title: 'Updated title',
            summary: 'First summary',
            tags: ['one', 'two', 'three'],
          },
        },
      });

      const getResult = await EntityAdmin.getEntity(context, id, {});
      if (expectOkResult(getResult)) {
        expect(getResult.value.item).toEqual({
          id,
          _type: 'MutationFoo',
          _name: name,
          _version: 1,
          title: 'Updated title',
          summary: 'First summary',
          tags: ['one', 'two', 'three'],
        });
      }
    }
  });

  test('Update with all values including references', async () => {
    const createBar1Result = await EntityAdmin.createEntity(
      context,
      { _type: 'MutationBar', _name: 'Bar 1' },
      { publish: true }
    );
    const createBar2Result = await EntityAdmin.createEntity(
      context,
      { _type: 'MutationBar', _name: 'Bar 2' },
      { publish: true }
    );
    if (expectOkResult(createBar1Result) && expectOkResult(createBar2Result)) {
      const { id: bar1Id, _name: bar1Name } = createBar1Result.value;
      const { id: bar2Id, _name: bar2Name } = createBar2Result.value;

      const createFooResult = await EntityAdmin.createEntity(
        context,
        {
          _type: 'MutationFoo',
          _name: 'First name',
          title: 'First title',
          summary: 'First summary',
          tags: ['one', 'two', 'three'],
        },
        { publish: true }
      );
      if (expectOkResult(createFooResult)) {
        const { id: fooId } = createFooResult.value;
        const result = await graphql(
          schema,
          `
            mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!, $publish: Boolean!) {
              updateMutationFooEntity(entity: $entity, publish: $publish) {
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
              }
            }
          `,
          undefined,
          { context: ok(context) },
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
            },
            publish: true,
          }
        );

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
            },
          },
        });

        const getResult = await EntityAdmin.getEntity(context, fooId, {});
        if (expectOkResult(getResult)) {
          expect(getResult.value.item).toEqual({
            id: fooId,
            _type: 'MutationFoo',
            _name: name,
            _version: 1,
            title: 'Updated title',
            summary: 'Updated summary',
            tags: ['these', 'are', 'new'],
            bar: { id: bar1Id },
            bars: [{ id: bar1Id }, { id: bar2Id }],
          });
        }
      }
    }
  });

  test('Error: Update with the wrong _type', async () => {
    const createResult = await EntityAdmin.createEntity(
      context,
      { _type: 'MutationFoo', _name: 'Name' },
      { publish: true }
    );
    if (expectOkResult(createResult)) {
      const { id } = createResult.value;
      const result = await graphql(
        schema,
        `
          mutation UpdateFooEntity($entity: AdminMutationFooUpdateInput!, $publish: Boolean!) {
            updateMutationFooEntity(entity: $entity, publish: $publish) {
              id
            }
          }
        `,
        undefined,
        { context: ok(context) },
        {
          entity: {
            id,
            _type: 'MutationBar', // should be Foo
            _name: 'Foo name',
            title: 'Foo title',
            summary: 'Foo summary',
          },
          publish: true,
        }
      );

      expect(result).toMatchInlineSnapshot(`
        Object {
          "data": null,
          "errors": Array [
            [GraphQLError: BadRequest: Specified type (entity._type=MutationBar) should be MutationFoo],
          ],
        }
      `);
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
      const { id, _name: name } = createResult.value;

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
              _deleted
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
            _name: name,
            _version: 1,
            _deleted: true,
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
      const { id, _name: name } = createResult.value;

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
              _deleted
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
            _name: name,
            _version: 1,
            _deleted: true,
          },
        },
      });
    }
  });
});
