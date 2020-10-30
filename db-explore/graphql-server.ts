#!/usr/bin/env npx ts-node
var express = require('express');
var { graphqlHTTP } = require('express-graphql');
import graphql, {
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import * as TypeSpecifications from './TypeSpecifications';
import { EntityFieldType } from './TypeSpecifications';

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

  for (const entityType of entityTypes) {
    const fields: GraphQLFieldConfigMap<any, any> = {
      id: { type: new GraphQLNonNull(GraphQLID) },
      type: { type: new GraphQLNonNull(entityTypeEnum) },
      name: { type: GraphQLString },
    };
    for (const field of entityType.fields) {
      switch (field.type) {
        case EntityFieldType.BasicString:
          fields[field.name] = { type: GraphQLString };
          break;
        case EntityFieldType.Reference:
          continue; //TODO handle reference
        case EntityFieldType.ReferenceSet:
          continue; //TODO handle references
        default:
          throw new Error(`Unexpected type (${field.type})`);
      }
    }
    types.push(
      new GraphQLObjectType({
        name: entityType.name,
        interfaces: [nodeInterface, entityInterface],
        fields,
      })
    );
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
