import { FieldType, Schema } from '@datadata/core';
import type { SchemaSpecification } from '@datadata/core';
import { graphql, printSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

function describeGeneratedSchema(schemaSpec: SchemaSpecification) {
  const schema = new Schema(schemaSpec);
  schema.validate().throwIfError();
  const generator = new GraphQLSchemaGenerator(schema);
  const graphQLSchema = generator.buildSchema();
  return printSchema(graphQLSchema);
}

async function querySchema(schemaSpec: SchemaSpecification, query: string) {
  const schema = new Schema(schemaSpec);
  schema.validate().throwIfError();
  const generator = new GraphQLSchemaGenerator(schema);
  const graphQLSchema = generator.buildSchema();
  return await graphql(graphQLSchema, query);
}

describe('Empty schema spec', () => {
  const schemaSpec = { entityTypes: [], valueTypes: [] };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('One empty entity type schema spec', () => {
  const schemaSpec = { entityTypes: [{ name: 'Foo', fields: [] }], valueTypes: [] };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
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
    const result = await querySchema(schemaSpec, query);
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
    const result = await querySchema(schemaSpec, query);

    // remove all fields except 'node'
    const queryType = result.data?.__schema.queryType as { fields: { name: string }[] };
    queryType.fields = queryType.fields.filter((x) => x.name === 'node');

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
    const result = await querySchema(schemaSpec, query);

    expect(result).toEqual(expected);
  });

  test('Ensure AdminEntityEdge matches Connection spec', async () => {
    // From https://relay.dev/graphql/connections.htm#sec-Edge-Types.Introspection
    const query = `{
      __type(name: "AdminEntityEdge") { # Changed from "Example"
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
                name: 'AdminEntity',
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
    const result = await querySchema(schemaSpec, query);

    expect(result).toEqual(expected);
  });

  test('Ensure AdminEntityConnection matches Connection spec', async () => {
    // From https://relay.dev/graphql/connections.htm#sec-Connection-Types.Introspection
    const query = `{
      __type(name: "AdminEntityConnection") { # Changed from ExampleConnection
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
                  name: 'AdminEntityEdge',
                  kind: 'OBJECT',
                },
              },
            },
          ],
        },
      },
    };
    const result = await querySchema(schemaSpec, query);

    if (result.data) {
      // Remove fields that are not in the spec
      result.data.__type.fields = result.data.__type.fields.filter(
        (x: { name: string }) => x.name !== 'totalCount'
      );
    }

    expect(result).toEqual(expected);
  });
});

describe('Two entity types with reference schema spec', () => {
  const schemaSpec = {
    entityTypes: [
      { name: 'Foo', fields: [{ name: 'fooField', type: FieldType.String }] },
      {
        name: 'Bar',
        fields: [
          { name: 'barField1', type: FieldType.String },
          { name: 'barField2', type: FieldType.EntityType },
          { name: 'barField3', type: FieldType.Location },
        ],
      },
    ],
    valueTypes: [],
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('Multiple references with entityTypes schema spec', () => {
  const schemaSpec = {
    entityTypes: [
      {
        name: 'Foo',
        fields: [
          { name: 'noMeansAll', type: FieldType.EntityType, entityTypes: [] },
          { name: 'bar', type: FieldType.EntityType, entityTypes: ['Bar'] },
          { name: 'bazBar', type: FieldType.EntityType, entityTypes: ['Baz', 'Bar'] },
          {
            name: 'fooBarBaz',
            type: FieldType.EntityType,
            entityTypes: ['Foo', 'Bar', 'Baz'],
          },
          {
            name: 'barBarBar',
            type: FieldType.EntityType,
            entityTypes: ['Bar', 'Bar', 'Bar'],
          },
        ],
      },
      { name: 'Bar', fields: [] },
      { name: 'Baz', fields: [] },
    ],
    valueTypes: [],
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('List of strings, locations and references schema spec', () => {
  const schemaSpec = {
    entityTypes: [
      {
        name: 'Foo',
        fields: [
          { name: 'strings', type: FieldType.String, list: true },
          { name: 'locations', type: FieldType.Location, list: true },
          { name: 'bars', type: FieldType.EntityType, list: true, entityTypes: ['Bar'] },
        ],
      },
      { name: 'Bar', fields: [] },
    ],
    valueTypes: [],
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('Value type schema spec', () => {
  const schemaSpec = {
    entityTypes: [
      {
        name: 'Foo',
        fields: [
          { name: 'valueOne', type: FieldType.ValueType, valueTypes: ['ValueOne'] },
          { name: 'unspecifiedValue', type: FieldType.ValueType },
          {
            name: 'valueOneOrList',
            type: FieldType.ValueType,
            valueTypes: ['ValueOne', 'ValueList'],
          },
          { name: 'nestedValue', type: FieldType.ValueType, valueTypes: ['NestedValue'] },
        ],
      },
      { name: 'Bar', fields: [] },
    ],
    valueTypes: [
      {
        name: 'ValueOne',
        fields: [
          { name: 'one', type: FieldType.String },
          { name: 'two', type: FieldType.EntityType, entityTypes: ['Bar'] },
          { name: 'three', type: FieldType.Location },
        ],
      },
      {
        name: 'ValueList',
        fields: [
          { name: 'one', type: FieldType.String, list: true },
          { name: 'two', type: FieldType.EntityType, list: true, entityTypes: ['Bar'] },
          { name: 'three', type: FieldType.Location, list: true },
        ],
      },
      {
        name: 'NestedValue',
        fields: [
          { name: 'text', type: FieldType.String },
          { name: 'child', type: FieldType.ValueType, valueTypes: ['NestedValue'] },
        ],
      },
    ],
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});
