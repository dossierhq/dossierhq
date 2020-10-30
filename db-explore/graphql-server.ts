#!/usr/bin/env npx ts-node
var express = require('express');
var { graphqlHTTP } = require('express-graphql');
import graphql, {
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';
import * as TypeSpecifications from './TypeSpecifications';
import {
  EntityFieldSpecification,
  EntityFieldType,
} from './TypeSpecifications';

function createReferenceField(
  fieldSpec: EntityFieldSpecification,
  entityInterface: GraphQLInterfaceType,
  entityTypes: GraphQLObjectType[]
): GraphQLFieldConfig<any, any> {
  if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
    const referencedTypes: GraphQLObjectType[] = [];
    for (const referencedName of fieldSpec.entityTypes) {
      const referencedType = entityTypes.find((x) => x.name === referencedName);
      if (!referencedType) {
        console.warn(`Can't find referenced type (${referencedName})`);
        return { type: entityInterface };
      }
      referencedTypes.push(referencedType);
    }
    if (referencedTypes.length === 1) {
      return { type: referencedTypes[0] };
    }
    // TODO can the generated name clash with other types definitions? Should there be a prefix?
    return {
      type: new GraphQLUnionType({
        name: `Generated${referencedTypes.map((x) => x.name).join('Or')}`,
        types: referencedTypes,
      }),
    };
  }
  return { type: entityInterface };
}

function createSchema() {
  const entityTypes = TypeSpecifications.getAllEntitySpecifications();

  const types: GraphQLNamedType[] = [];

  const nodeInterface = new GraphQLInterfaceType({
    name: 'Node',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
    },
  });
  types.push(nodeInterface);

  const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
  entityTypes.forEach((et) => (entityTypeEnumValues[et.name] = {}));
  const entityTypeEnum = new GraphQLEnumType({
    name: 'EntityType',
    values: entityTypeEnumValues,
  });
  types.push(entityTypeEnum);

  const entityInterface = new GraphQLInterfaceType({
    name: 'Entity',
    interfaces: [nodeInterface],
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      type: { type: new GraphQLNonNull(entityTypeEnum) },
      name: { type: GraphQLString },
    },
  });
  types.push(entityInterface);

  const gqEntityTypes: GraphQLObjectType[] = [];
  for (const entityType of entityTypes) {
    const type = new GraphQLObjectType({
      name: entityType.name,
      interfaces: [nodeInterface, entityInterface],
      fields: () => {
        const fields: GraphQLFieldConfigMap<any, any> = {
          id: { type: new GraphQLNonNull(GraphQLID) },
          type: { type: new GraphQLNonNull(entityTypeEnum) },
          name: { type: GraphQLString },
        };
        for (const fieldSpec of entityType.fields) {
          switch (fieldSpec.type) {
            case EntityFieldType.BasicString:
              fields[fieldSpec.name] = { type: GraphQLString };
              break;
            case EntityFieldType.Reference:
              fields[fieldSpec.name] = createReferenceField(
                fieldSpec,
                entityInterface,
                gqEntityTypes
              );
              break;
            case EntityFieldType.ReferenceSet:
              continue; //TODO handle reference
            default:
              throw new Error(`Unexpected type (${fieldSpec.type})`);
          }
        }
        return fields;
      },
    });
    types.push(type);
    gqEntityTypes.push(type);
  }

  const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
      node: {
        type: nodeInterface,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
      },
    },
  });

  return new GraphQLSchema({ query: queryType, types });
}

// The root provides a resolver function for each API endpoint
var root = {
  hello: () => {
    return 'Hello world!';
  },
};

var app = express();
app.use(
  '/graphql',
  graphqlHTTP({
    schema: createSchema(),
    rootValue: root,
    graphiql: true,
  })
);
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');
