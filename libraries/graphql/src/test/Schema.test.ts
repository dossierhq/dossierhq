import { FieldType, Schema } from '@dossierhq/core';
import { graphql, printSchema } from 'graphql';
import { describe, expect, test } from 'vitest';
import { GraphQLSchemaGenerator } from '../GraphQLSchemaGenerator.js';

function buildSchema(schema: Schema, { published, admin }: { published: boolean; admin: boolean }) {
  const generator = new GraphQLSchemaGenerator({
    schema: admin ? schema : null,
    publishedSchema: published ? schema.toPublishedSchema() : null,
  });
  return generator.buildSchema();
}

function describeGeneratedSchema(schema: Schema, options: { published: boolean; admin: boolean }) {
  const graphQLSchema = buildSchema(schema, options);
  return printSchema(graphQLSchema);
}

async function querySchema(
  schema: Schema,
  options: { published: boolean; admin: boolean },
  query: string,
) {
  const graphQLSchema = buildSchema(schema, options);
  return await graphql({ schema: graphQLSchema, source: query });
}

describe('Empty schema spec', () => {
  const schema = Schema.createAndValidate({}).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('One empty entity type schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [{ name: 'Foo', publishable: true, fields: [] }],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Ensure Node matches Global Object Identification spec', async () => {
    // From https://graphql.org/learn/global-object-identification/
    const query = `{
      __type(name: "Node") {
        name
        kind
        fields {
          name
          type {
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }`;
    const expected = {
      data: {
        __type: {
          name: 'Node',
          kind: 'INTERFACE',
          fields: [
            {
              name: 'id',
              type: {
                kind: 'NON_NULL',
                ofType: {
                  name: 'ID',
                  kind: 'SCALAR',
                },
              },
            },
          ],
        },
      },
    };
    const result = await querySchema(schema, { admin: true, published: true }, query);
    expect(result).toEqual(expected);
  });

  test('Ensure node() matches Global Object Identification spec', async () => {
    // From https://graphql.org/learn/global-object-identification/
    const query = `{
      __schema {
        queryType {
          fields {
            name
            type {
              name
              kind
            }
            args {
              name
              type {
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    }`;
    const expected = {
      data: {
        __schema: {
          queryType: {
            fields: [
              // This array may have other entries
              {
                name: 'node',
                type: {
                  name: 'Node',
                  kind: 'INTERFACE',
                },
                args: [
                  {
                    name: 'id',
                    type: {
                      kind: 'NON_NULL',
                      ofType: {
                        name: 'ID',
                        kind: 'SCALAR',
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const result = await querySchema(schema, { admin: true, published: true }, query);

    // remove all fields except 'node'
    const queryType = (result.data as { __schema: { queryType: { fields: { name: string }[] } } })
      .__schema.queryType;
    queryType.fields = queryType.fields.filter((it) => it.name === 'node');

    expect(result).toEqual(expected);
  });

  test('Ensure PageInfo matches Connection spec', async () => {
    // From https://relay.dev/graphql/connections.htm#sec-undefined.PageInfo.Introspection
    const query = `{
      __type(name: "PageInfo") {
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }`;
    const expected = {
      data: {
        __type: {
          fields: [
            // May contain other fields.
            {
              name: 'hasNextPage',
              type: {
                name: null,
                kind: 'NON_NULL',
                ofType: {
                  name: 'Boolean',
                  kind: 'SCALAR',
                },
              },
            },
            {
              name: 'hasPreviousPage',
              type: {
                name: null,
                kind: 'NON_NULL',
                ofType: {
                  name: 'Boolean',
                  kind: 'SCALAR',
                },
              },
            },
            {
              name: 'startCursor',
              type: {
                name: null,
                kind: 'NON_NULL',
                ofType: {
                  name: 'String',
                  kind: 'SCALAR',
                },
              },
            },
            {
              name: 'endCursor',
              type: {
                name: null,
                kind: 'NON_NULL',
                ofType: {
                  name: 'String',
                  kind: 'SCALAR',
                },
              },
            },
          ],
        },
      },
    };
    const result = await querySchema(schema, { admin: true, published: true }, query);

    expect(result).toEqual(expected);
  });

  test('Ensure AdminEntityEdge matches Connection spec', async () => {
    // From https://relay.dev/graphql/connections.htm#sec-Edge-Types.Introspection
    const query = `{
      __type(name: "EntityEdge") { # Changed from "Example"
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }`;
    const expected = {
      data: {
        __type: {
          fields: [
            // May contain other items
            {
              name: 'node',
              type: {
                // Changed from "Example" / "Object"
                name: 'Entity',
                kind: 'INTERFACE',
                ofType: null,
              },
            },
            {
              name: 'cursor',
              type: {
                // This shows the cursor type as String!, other types are possible
                name: null,
                kind: 'NON_NULL',
                ofType: {
                  name: 'String',
                  kind: 'SCALAR',
                },
              },
            },
          ],
        },
      },
    };
    const result = await querySchema(schema, { admin: true, published: true }, query);

    expect(result).toEqual(expected);
  });

  test('Ensure AdminEntityConnection matches Connection spec', async () => {
    // From https://relay.dev/graphql/connections.htm#sec-Connection-Types.Introspection
    const query = `{
      __type(name: "EntityConnection") { # Changed from ExampleConnection
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }`;
    const expected = {
      data: {
        __type: {
          fields: [
            // May contain other items
            {
              name: 'pageInfo',
              type: {
                name: null,
                kind: 'NON_NULL',
                ofType: {
                  name: 'PageInfo',
                  kind: 'OBJECT',
                },
              },
            },
            {
              name: 'edges',
              type: {
                name: null,
                kind: 'LIST',
                ofType: {
                  // Changed from "ExampleEdge"
                  name: 'EntityEdge',
                  kind: 'OBJECT',
                },
              },
            },
          ],
        },
      },
    };
    const result = (await querySchema(schema, { admin: true, published: true }, query)) as {
      data: { __type: { fields: { name: string }[] } };
    };

    if (result.data) {
      // Remove fields that are not in the spec
      result.data.__type.fields = result.data.__type.fields.filter(
        (it: { name: string }) => it.name !== 'totalCount',
      );
    }

    expect(result).toEqual(expected);
  });
});

describe('Two entity types with reference schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      { name: 'Foo', publishable: true, fields: [{ name: 'fooField', type: FieldType.String }] },
      {
        name: 'Bar',
        publishable: true,
        fields: [
          { name: 'barField1', type: FieldType.String },
          { name: 'barField2', type: FieldType.Reference },
          { name: 'barField3', type: FieldType.Location },
          { name: 'barField4', type: FieldType.Boolean },
        ],
      },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('Multiple references with entityTypes schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: true,
        fields: [
          { name: 'noMeansAll', type: FieldType.Reference, entityTypes: [] },
          { name: 'bar', type: FieldType.Reference, entityTypes: ['Bar'] },
          { name: 'bazBar', type: FieldType.Reference, entityTypes: ['Baz', 'Bar'] },
          {
            name: 'fooBarBaz',
            type: FieldType.Reference,
            entityTypes: ['Foo', 'Bar', 'Baz'],
          },
          {
            name: 'barBarBar',
            type: FieldType.Reference,
            entityTypes: ['Bar', 'Bar', 'Bar'],
          },
        ],
      },
      { name: 'Bar', publishable: true, fields: [] },
      { name: 'Baz', publishable: true, fields: [] },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('List of strings, booleans, locations, numbers and references schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: true,
        fields: [
          { name: 'strings', type: FieldType.String, list: true },
          { name: 'booleans', type: FieldType.Boolean, list: true },
          { name: 'locations', type: FieldType.Location, list: true },
          { name: 'floats', type: FieldType.Number, list: true },
          { name: 'integers', type: FieldType.Number, integer: true, list: true },
          { name: 'bars', type: FieldType.Reference, list: true, entityTypes: ['Bar'] },
        ],
      },
      { name: 'Bar', publishable: true, fields: [] },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('Component type schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: true,
        fields: [
          { name: 'valueOne', type: FieldType.Component, componentTypes: ['ValueOne'] },
          { name: 'unspecifiedValue', type: FieldType.Component },
          {
            name: 'valueOneOrList',
            type: FieldType.Component,
            componentTypes: ['ValueOne', 'ValueList'],
          },
          { name: 'nestedValue', type: FieldType.Component, componentTypes: ['NestedValue'] },
        ],
      },
      { name: 'Bar', publishable: true, fields: [] },
    ],
    componentTypes: [
      {
        name: 'ValueOne',
        adminOnly: false,
        fields: [
          { name: 'one', type: FieldType.String },
          { name: 'two', type: FieldType.Reference, entityTypes: ['Bar'] },
          { name: 'three', type: FieldType.Location },
          { name: 'four', type: FieldType.Boolean },
        ],
      },
      {
        name: 'ValueList',
        adminOnly: false,
        fields: [
          { name: 'one', type: FieldType.String, list: true },
          { name: 'two', type: FieldType.Reference, list: true, entityTypes: ['Bar'] },
          { name: 'three', type: FieldType.Location, list: true },
          { name: 'four', type: FieldType.Boolean, list: true },
        ],
      },
      {
        name: 'NestedValue',
        adminOnly: false,
        fields: [
          { name: 'text', type: FieldType.String },
          { name: 'child', type: FieldType.Component, componentTypes: ['NestedValue'] },
        ],
      },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('Rich text schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: true,
        fields: [{ name: 'body', type: FieldType.RichText }],
      },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('Admin only entity and value schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: false,
        fields: [{ name: 'body', type: FieldType.String }],
      },
      {
        name: 'Bar',
        publishable: true,
        fields: [{ name: 'body', type: FieldType.String }],
      },
    ],
    componentTypes: [
      {
        name: 'ValueOne',
        adminOnly: true,
        fields: [{ name: 'body', type: FieldType.String }],
      },
      {
        name: 'ValueTwo',
        adminOnly: false,
        fields: [{ name: 'body', type: FieldType.String }],
      },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('Admin only field in entity and value schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: true,
        fields: [{ name: 'body', type: FieldType.String, adminOnly: true }],
      },
    ],
    componentTypes: [
      {
        name: 'ValueOne',
        adminOnly: false,
        fields: [{ name: 'body', type: FieldType.String, adminOnly: true }],
      },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('Required fields schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: true,
        fields: [
          { name: 'body', type: FieldType.String, required: true },
          { name: 'tags', type: FieldType.String, list: true, required: true },
          {
            name: 'valueOne',
            type: FieldType.Component,
            required: true,
            componentTypes: ['ValueOne'],
          },
        ],
      },
    ],
    componentTypes: [
      {
        name: 'ValueOne',
        adminOnly: false,
        fields: [{ name: 'body', type: FieldType.String, required: true }],
      },
    ],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});

describe('One entity type with unique index schema spec', () => {
  const schema = Schema.createAndValidate({
    entityTypes: [
      {
        name: 'Foo',
        publishable: true,
        fields: [{ name: 'bar', type: FieldType.String, index: 'fooUnique' }],
      },
    ],
    indexes: [{ name: 'fooUnique', type: 'unique' }],
  }).valueOrThrow();

  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: true });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (admin only)', () => {
    const result = describeGeneratedSchema(schema, { admin: true, published: false });
    expect(result).toMatchSnapshot();
  });

  test('Generated QL schema (published only)', () => {
    const result = describeGeneratedSchema(schema, { admin: false, published: true });
    expect(result).toMatchSnapshot();
  });
});
