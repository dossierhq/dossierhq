import { EntityFieldType, Schema } from '@datadata/core';
import type { SchemaSpecification } from '@datadata/core';
import { graphql, printSchema } from 'graphql';
import { GraphQLSchemaGenerator } from '../src/GraphQLSchemaGenerator';

function describeGeneratedSchema(schemaSpec: SchemaSpecification) {
  const generator = new GraphQLSchemaGenerator(new Schema(schemaSpec));
  const graphQLSchema = generator.buildSchema();
  return printSchema(graphQLSchema);
}

async function querySchema(schemaSpec: SchemaSpecification, query: string) {
  const generator = new GraphQLSchemaGenerator(new Schema(schemaSpec));
  const graphQLSchema = generator.buildSchema();
  return await graphql(graphQLSchema, query);
}

describe('Empty schema spec', () => {
  const schemaSpec = { entityTypes: {}, valueTypes: {} };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('One empty entity type schema spec', () => {
  const schemaSpec = { entityTypes: { Foo: { fields: [] } }, valueTypes: {} };
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
    entityTypes: {
      Foo: { fields: [{ name: 'fooField', type: EntityFieldType.String }] },
      Bar: {
        fields: [
          { name: 'barField1', type: EntityFieldType.String },
          { name: 'barField2', type: EntityFieldType.Reference },
        ],
      },
    },
    valueTypes: {},
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('Multiple references with entityTypes schema spec', () => {
  const schemaSpec = {
    entityTypes: {
      Foo: {
        fields: [
          { name: 'noMeansAll', type: EntityFieldType.Reference, entityTypes: [] },
          { name: 'bar', type: EntityFieldType.Reference, entityTypes: ['Bar'] },
          { name: 'bazBar', type: EntityFieldType.Reference, entityTypes: ['Baz', 'Bar'] },
          {
            name: 'fooBarBaz',
            type: EntityFieldType.Reference,
            entityTypes: ['Foo', 'Bar', 'Baz'],
          },
          {
            name: 'barBarBar',
            type: EntityFieldType.Reference,
            entityTypes: ['Bar', 'Bar', 'Bar'],
          },
        ],
      },
      Bar: { fields: [] },
      Baz: { fields: [] },
    },
    valueTypes: {},
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('List of strings and references schema spec', () => {
  const schemaSpec = {
    entityTypes: {
      Foo: {
        fields: [
          { name: 'strings', type: EntityFieldType.String, list: true },
          { name: 'bars', type: EntityFieldType.Reference, list: true, entityTypes: ['Bar'] },
        ],
      },
      Bar: { fields: [] },
    },
    valueTypes: {},
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});
