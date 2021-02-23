import { CoreTestUtils, FieldType, ok } from '@datadata/core';
import { EntityAdmin, ServerTestUtils } from '@datadata/server';
import type { SessionContext, Server } from '@datadata/server';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

const { expectOkResult } = CoreTestUtils;
const { createTestServer, ensureSessionContext, updateSchema } = ServerTestUtils;

let server: Server;
let context: SessionContext;
let schema: GraphQLSchema;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'mutation');
  await updateSchema(context, {
    entityTypes: [
      {
        name: 'MutationFoo',
        fields: [
          { name: 'title', type: FieldType.String, isName: true },
          { name: 'summary', type: FieldType.String },
          { name: 'tags', type: FieldType.String, list: true },
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
  });
  schema = new GraphQLSchemaGenerator(context.server.getSchema()).buildSchema();
});
afterAll(async () => {
  await server?.shutdown();
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
      { context: ok(context) },
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
          location: { lat: 55.60498, lng: 13.003822 },
          locations: [
            { lat: 55.60498, lng: 13.003822 },
            { lat: 56.381561, lng: 13.99286 },
          ],
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
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
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

  test('Create with value type with reference', async () => {
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
        { context: ok(context) },
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

      const getResult = await EntityAdmin.getEntity(context, fooId, {});
      if (expectOkResult(getResult)) {
        expect(getResult.value.item).toEqual({
          id: fooId,
          _type: 'MutationFoo',
          _name: fooName,
          _version: 0,
          title: 'Foo title',
          summary: 'Foo summary',
          stringedBar: {
            _type: 'MutationStringedBar',
            text: 'Value text',
            bar: { id: barId },
          },
        });
      }
    }
  });

  test('Create with value JSON', async () => {
    const createBarResult = await EntityAdmin.createEntity(
      context,
      { _type: 'MutationBar', _name: 'Bar' },
      { publish: true }
    );

    if (expectOkResult(createBarResult)) {
      const { id: barId } = createBarResult.value;

      const createFooResult = await graphql(
        schema,
        `
          mutation CreateFooEntity($entity: AdminMutationFooCreateInput!, $publish: Boolean!) {
            createMutationFooEntity(entity: $entity, publish: $publish) {
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
        { context: ok(context) },
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

      const getResult = await EntityAdmin.getEntity(context, fooId, {});
      if (expectOkResult(getResult)) {
        expect(getResult.value.item).toEqual({
          id: fooId,
          _type: 'MutationFoo',
          _name: fooName,
          _version: 0,
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
    }
  });

  test('Create nested value item with inner JSON', async () => {
    const createResult = await graphql(
      schema,
      `
        mutation CreateFooEntity($entity: AdminMutationFooCreateInput!, $publish: Boolean!) {
          createMutationFooEntity(entity: $entity, publish: $publish) {
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
      { context: ok(context) },
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
        publish: true,
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

    const getResult = await EntityAdmin.getEntity(context, fooId, {});
    if (expectOkResult(getResult)) {
      expect(getResult.value.item).toEqual({
        id: fooId,
        _type: 'MutationFoo',
        _name: fooName,
        _version: 0,
        nestedValue: {
          _type: 'MutationNestedValue',
          text: 'Outer',
          child: { _type: 'MutationNestedValue', text: 'Inner' },
        },
      });
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
            publish: true,
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
