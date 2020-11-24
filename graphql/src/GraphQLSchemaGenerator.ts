import { EntityFieldType, ErrorType } from '@datadata/core';
import type {
  AdminEntity,
  Entity,
  EntityTypeSpecification,
  Result,
  Schema,
  SessionContext,
} from '@datadata/core';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLString,
  isInputType,
  isInterfaceType,
  isOutputType,
} from 'graphql';
import type {
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLSchemaConfig,
} from 'graphql';
import { loadAdminEntity, loadAdminSearchEntities, loadEntity } from './DataLoaders';

export interface SessionGraphQLContext {
  context: Result<SessionContext, ErrorType.NotAuthenticated>;
}

function toAdminTypeName(name: string) {
  return 'Admin' + name;
}

function fieldConfigWithArgs<TSource, TContext, TArgs>(
  config: GraphQLFieldConfig<TSource, TContext, TArgs>
): GraphQLFieldConfig<TSource, TContext> {
  return config as GraphQLFieldConfig<TSource, TContext>;
}

export class GraphQLSchemaGenerator<TContext extends SessionGraphQLContext> {
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

  getOutputType(name: string): GraphQLOutputType {
    const type = this.getType(name);
    if (isOutputType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an output type`);
  }

  getInputType(name: string): GraphQLInputType {
    const type = this.getType(name);
    if (isInputType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an input type`);
  }

  getInterface(name: string): GraphQLInterfaceType {
    const type = this.getType(name);
    if (isInterfaceType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an interface`);
  }

  getInterfaces(...names: string[]): GraphQLInterfaceType[] {
    return names.map((name) => this.getInterface(name));
  }

  getOrCreateEntityUnion(isAdmin: boolean, names: string[]): GraphQLOutputType {
    if (names.length === 0) {
      return this.getOutputType(isAdmin ? 'AdminEntity' : 'Entity');
    }

    // Convert to AdminName if isAdmin, remove duplicated, sort alphabetically
    const filteredNames = [...new Set(names.map((x) => (isAdmin ? toAdminTypeName(x) : x)))];
    filteredNames.sort();

    if (filteredNames.length === 1) {
      return this.getOutputType(filteredNames[0]);
    }

    const enumName = `$${filteredNames.join('Or')}`;
    const existingEnum = this.#types.find((x) => x.name === enumName);
    if (existingEnum) {
      if (isOutputType(existingEnum)) {
        return existingEnum;
      }
      throw new Error(`Type ${enumName} is not an output type`);
    }

    const enumValues: GraphQLEnumValueConfigMap = {};
    filteredNames.forEach((name) => (enumValues[name] = {}));
    const enumType = new GraphQLEnumType({
      name: enumName,
      values: enumValues,
    });

    this.addType(enumType);
    return enumType;
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

    // PageInfo
    this.addType(
      new GraphQLObjectType({
        name: 'PageInfo',
        fields: {
          hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
          hasPreviousPage: { type: new GraphQLNonNull(GraphQLBoolean) },
          startCursor: { type: new GraphQLNonNull(GraphQLString) },
          endCursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    if (this.schema.getEntityTypeCount() === 0) {
      return;
    }

    // EntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const typeName of Object.keys(this.schema.spec.entityTypes)) {
      entityTypeEnumValues[typeName] = {};
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
        interfaces: this.getInterfaces('Node'),
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          _name: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );
  }

  addEntityTypes(): void {
    for (const [entityName, entitySpec] of Object.entries(this.schema.spec.entityTypes)) {
      this.addEntityType(entityName, entitySpec);
    }
  }

  addEntityType(name: string, entitySpec: EntityTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<Entity, TContext>({
        name,
        interfaces: this.getInterfaces('Node', 'Entity'),
        isTypeOf: (source, unusedContext, unusedInfo) => source._type === name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _name: { type: new GraphQLNonNull(GraphQLString) },
          };
          for (const fieldSpec of entitySpec.fields) {
            switch (fieldSpec.type) {
              case EntityFieldType.Reference:
                fields[fieldSpec.name] = {
                  type: this.getOrCreateEntityUnion(false, fieldSpec.entityTypes || []),
                };
                break;
              case EntityFieldType.String:
                fields[fieldSpec.name] = { type: GraphQLString };
                break;
              default:
                throw new Error(`Unexpected type (${fieldSpec.type})`);
            }
          }
          return fields;
        },
      })
    );
  }

  addAdminSupportingTypes(): void {
    if (this.schema.getEntityTypeCount() === 0) {
      return;
    }
    // AdminEntity
    this.addType(
      new GraphQLInterfaceType({
        name: 'AdminEntity',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          _name: { type: new GraphQLNonNull(GraphQLString) },
          _type: { type: new GraphQLNonNull(this.getType('EntityType')) },
        },
      })
    );

    // AdminEntityEdge
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityEdge',
        fields: {
          node: { type: this.getOutputType('AdminEntity') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // AdminEntityConnection
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityConnection',
        fields: {
          pageInfo: { type: new GraphQLNonNull(this.getType('PageInfo')) },
          edges: { type: new GraphQLList(this.getType('AdminEntityEdge')) },
        },
      })
    );

    // AdminFilterInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminFilterInput',
        fields: {
          entityTypes: { type: new GraphQLList(GraphQLString) },
        },
      })
    );
  }

  addAdminEntityTypes(): void {
    for (const [entityName, entitySpec] of Object.entries(this.schema.spec.entityTypes)) {
      this.addAdminEntityType(toAdminTypeName(entityName), entitySpec);
    }
  }

  addAdminEntityType(name: string, entitySpec: EntityTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<AdminEntity, TContext>({
        name,
        interfaces: this.getInterfaces('AdminEntity'),
        isTypeOf: (source, unusedContext, unusedInfo) => toAdminTypeName(source._type) === name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _type: { type: new GraphQLNonNull(this.getType('EntityType')) },
            _name: { type: new GraphQLNonNull(GraphQLString) },
          };
          for (const fieldSpec of entitySpec.fields) {
            switch (fieldSpec.type) {
              case EntityFieldType.Reference:
                fields[fieldSpec.name] = {
                  type: this.getOrCreateEntityUnion(true, fieldSpec.entityTypes || []),
                };
                break;
              case EntityFieldType.String:
                fields[fieldSpec.name] = { type: GraphQLString };
                break;
              default:
                throw new Error(`Unexpected type (${fieldSpec.type})`);
            }
          }
          return fields;
        },
      })
    );
  }

  buildQueryFieldNode<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getInterface('Node'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (source, args, context, unusedInfo) => {
        return await loadEntity(context, args.id);
      },
    });
  }

  buildQueryFieldAdminEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; version: number | null }>({
      type: this.getInterface('AdminEntity'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        version: { type: GraphQLInt },
      },
      resolve: async (source, args, context, unusedInfo) => {
        return await loadAdminEntity(context, args.id, args.version);
      },
    });
  }

  buildQueryFieldAdminSearchEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        filter?: { entityTypes?: string[] };
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('AdminEntityConnection'),
      args: {
        filter: { type: this.getInputType('AdminFilterInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (source, args, context, unusedInfo) => {
        const { filter, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadAdminSearchEntities(context, filter, paging);
      },
    });
  }

  buildSchemaConfig<TSource>(): GraphQLSchemaConfig {
    this.schema.validate().throwIfError();

    this.addSupportingTypes();
    this.addEntityTypes();
    this.addAdminSupportingTypes();
    this.addAdminEntityTypes();

    const includeEntities = Object.keys(this.schema.spec.entityTypes).length > 0;

    const queryType = new GraphQLObjectType<TSource, TContext>({
      name: 'Query',
      fields: {
        node: this.buildQueryFieldNode(),
        ...(includeEntities
          ? {
              adminEntity: this.buildQueryFieldAdminEntity(),
              adminSearchEntities: this.buildQueryFieldAdminSearchEntities(),
            }
          : {}),
      },
    });
    return { query: queryType, types: this.#types };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
