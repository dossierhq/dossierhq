import { EntityFieldType, Schema } from '@datadata/core';
import type { SchemaSpecification } from '@datadata/core';
import { printSchema } from 'graphql';
import { GraphQLSchemaGenerator } from './GraphQLSchemaGenerator';

async function describeGeneratedSchema(schemaSpec: SchemaSpecification) {
  const generator = new GraphQLSchemaGenerator(new Schema(schemaSpec));
  const graphQLSchema = generator.buildSchema();
  return printSchema(graphQLSchema);
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

describe('Two entity types schema spec', () => {
  const schemaSpec = {
    entityTypes: {
      Foo: { fields: [{ name: 'fooField', type: EntityFieldType.String }] },
      Bar: {
        fields: [
          { name: 'barField1', type: EntityFieldType.String },
          { name: 'barField2', type: EntityFieldType.String },
        ],
      },
    },
  };
  test('Generated QL schema', async () => {
    const result = await describeGeneratedSchema(schemaSpec);
    expect(result).toMatchSnapshot();
  });
});
