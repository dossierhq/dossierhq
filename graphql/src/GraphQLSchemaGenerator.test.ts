import { Schema } from '@datadata/core';
import type { SchemaSpecification } from '@datadata/core';
import { ExecutionResult, graphql, specifiedScalarTypes } from 'graphql';
import { GraphQLSchemaGenerator } from './GraphQLSchemaGenerator';

const schemaQuery = `
query {
  __schema {
    types {
      name
      kind
      interfaces {
        name
      }
      fields {
        name
        type {
          name
          kind
          ofType {
            name
          }
        }
      }
      enumValues {
        name
      }
    }
  }
}`;

function isNameOfScalar(name: string) {
  return specifiedScalarTypes.findIndex((x) => x.name === name) >= 0;
}

function cleanupSchemaResponse(response: ExecutionResult) {
  const types = response.data?.__schema.types;
  if (types) {
    for (let i = types.length - 1; i >= 0; i -= 1) {
      const type = types[i];
      if (type.name.startsWith('__') || isNameOfScalar(type.name)) {
        types.splice(i, 1);
        continue;
      }
    }
  }
}

async function describeGeneratedSchema(schemaSpec: SchemaSpecification) {
  const generator = new GraphQLSchemaGenerator(new Schema(schemaSpec));
  const result = await graphql(generator.buildSchema(), schemaQuery);
  cleanupSchemaResponse(result);
  return result;
}

describe('Empty schema spec', () => {
  const schemaSpec = { entityTypes: {} };
  test('Generated QL schema', async () => {
    const result = await describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});

describe('One empty entity type schema spec', () => {
  const schemaSpec = { entityTypes: { Foo: { fields: [] } } };
  test('Generated QL schema', async () => {
    const result = await describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});
