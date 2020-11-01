#!/usr/bin/env npx ts-node
require('dotenv').config();
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import {
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';

import * as Core from './Core';
import * as TypeSpecifications from './TypeSpecifications';
import {
  EntityFieldSpecification,
  EntityFieldType,
} from './TypeSpecifications';

function createReferenceField<TSource, TContext>(
  fieldSpec: EntityFieldSpecification,
  entityInterface: GraphQLInterfaceType,
  entityTypes: GraphQLObjectType[]
): GraphQLFieldConfig<TSource, TContext> {
  if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
    const referencedTypes: GraphQLObjectType<TSource, TContext>[] = [];
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

function buildField<TSource, TContext, TArgs>(
  options: GraphQLFieldConfig<TSource, TContext, TArgs>
) {
  return options as GraphQLFieldConfig<
    TSource,
    TContext,
    { [argName: string]: any }
  >;
}

function createSchema<TSource, TContext>() {
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

  const gqEntityTypes: GraphQLObjectType<{ type: string }, TContext>[] = [];
  for (const entityType of entityTypes) {
    const type = new GraphQLObjectType<{ type: string }, TContext>({
      name: entityType.name,
      interfaces: [nodeInterface, entityInterface],
      isTypeOf: (
        source: { type: string },
        context: TContext,
        info: GraphQLResolveInfo
      ) => source.type === entityType.name,
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

  const queryType = new GraphQLObjectType<TSource, TContext>({
    name: 'Query',
    fields: {
      node: buildField<TSource, TContext, { id: string }>({
        type: nodeInterface,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: async (source, { id }, context) => {
          const { item } = await Core.getEntity(id); // TODO skip fetching references
          return {
            id: item.uuid,
            name: item.name,
            type: item.type, // TODO skip type since __typename already exist?
            ...item.fields, // TODO should this be the output from getEntity?
          };
        },
      }),

      nodes: buildField<TSource, TContext, { ids: string[] }>({
        type: new GraphQLNonNull(new GraphQLList(nodeInterface)),
        args: {
          ids: {
            type: new GraphQLNonNull(
              new GraphQLList(new GraphQLNonNull(GraphQLID))
            ),
          },
        },
        resolve: async (source, { ids }, context) => {
          const { items } = await Core.getEntities(ids); // TODO skip fetching references
          // TODO return null if 404 on any node (https://graphql.org/learn/global-object-identification/#fields)
          return items.map((item) => ({
            id: item.uuid,
            name: item.name,
            type: item.type,
            ...item.fields, // TODO should this be the output from getEntity?
          }));
        },
      }),

      randomEntity: buildField<TSource, TContext, void>({
        type: entityInterface,
        resolve: async (source, args, context) => {
          const result = await Core.getRandomEntity({}); // TODO skip fetching references
          if (!result) {
            return null;
          }
          const { item } = result;
          return {
            id: item.uuid,
            name: item.name,
            type: item.type, // TODO skip type since __typename already exist?
            ...item.fields, // TODO should this be the output from getEntity?
          };
        },
      }),
    },
  });

  return new GraphQLSchema({ query: queryType, types });
}

var app = express();
app.use(
  '/graphql',
  graphqlHTTP({
    schema: createSchema<any, GraphQLSchema>(),
    graphiql: true,
  })
);
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');
