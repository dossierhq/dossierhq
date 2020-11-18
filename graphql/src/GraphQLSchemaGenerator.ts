import type { Schema } from '@datadata/core';
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  isInterfaceType,
} from 'graphql';
import type { GraphQLEnumValueConfigMap, GraphQLNamedType, GraphQLSchemaConfig } from 'graphql';

export class GraphQLSchemaGenerator {
  #types: GraphQLNamedType[] = [];

  constructor(readonly schema: Schema) {}

  addType(type: GraphQLNamedType): void {
    if (this.#types.find((x) => x.name === type.name)) {
      throw new Error(`Type with name ${type.name} already exists`);
    }
    this.#types.push(type);
  }

  getType(name: string): GraphQLNamedType {
    const type = this.#types.find((x) => x.name === name);
    if (!type) {
      throw new Error(`Type with name ${name} doesn't exist`);
    }
    return type;
  }

  getInterface(name: string): GraphQLInterfaceType {
    const type = this.getType(name);
    if (isInterfaceType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an interface`);
  }

  addSupportingTypes(): void {
    // Node
    this.addType(
      new GraphQLInterfaceType({
        name: 'Node',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
      })
    );

    // EntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const typeName of Object.keys(this.schema.spec.entityTypes)) {
      entityTypeEnumValues[typeName] = {};
    }
    if (Object.keys(entityTypeEnumValues).length === 0) {
      // Can't create EntityType with no enum values
      return;
    }
    this.addType(
      new GraphQLEnumType({
        name: 'EntityType',
        values: entityTypeEnumValues,
      })
    );

    // Entity
    this.addType(
      new GraphQLInterfaceType({
        name: 'Entity',
        interfaces: [this.getInterface('Node')],
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          _type: { type: new GraphQLNonNull(this.getType('EntityType')) },
          _name: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );
  }

  buildSchemaConfig<TSource, TContext>(): GraphQLSchemaConfig {
    this.addSupportingTypes();
    const queryType = new GraphQLObjectType<TSource, TContext>({
      name: 'Query',
      fields: {
        hello: {
          type: GraphQLString,
          resolve() {
            return 'world';
          },
        },
      },
    });
    return { query: queryType, types: this.#types };
  }

  buildSchema<TSource, TContext>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource, TContext>());
  }
}
