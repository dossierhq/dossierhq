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
  const schemaSpec = { entityTypes: {} };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('One empty entity type schema spec', () => {
  const schemaSpec = { entityTypes: { Foo: { fields: [] } } };
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
  };
  test('Generated QL schema', () => {
    const result = describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});
