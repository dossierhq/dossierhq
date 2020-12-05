import { EntityFieldType, ErrorType, notOk } from '@datadata/core';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
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
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  isEnumType,
  isInputType,
  isInterfaceType,
  isOutputType,
} from 'graphql';
import type {
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLSchemaConfig,
} from 'graphql';
import {
  loadAdminEntity,
  loadAdminSearchEntities,
  loadEntity,
  loadVersionHistory,
} from './DataLoaders';
import * as Mutations from './Mutations';

export interface SessionGraphQLContext {
  context: Result<SessionContext, ErrorType.NotAuthenticated>;
}

function toAdminTypeName(name: string) {
  return 'Admin' + name;
}

function toAdminCreateInputTypeName(name: string) {
  return `Admin${name}CreateInput`;
}

function toAdminUpdateInputTypeName(name: string) {
  return `Admin${name}UpdateInput`;
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

  getEnumType(name: string): GraphQLEnumType {
    const type = this.getType(name);
    if (isEnumType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an enum type`);
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
            let fieldType;
            switch (fieldSpec.type) {
              case EntityFieldType.Reference:
                fieldType = this.getOrCreateEntityUnion(false, fieldSpec.entityTypes || []);
                break;
              case EntityFieldType.String:
                fieldType = GraphQLString;
                break;
              default:
                throw new Error(`Unexpected type (${fieldSpec.type})`);
            }

            fields[fieldSpec.name] = {
              type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
            };
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
          _version: { type: new GraphQLNonNull(GraphQLInt) },
          _deleted: { type: new GraphQLNonNull(GraphQLBoolean) },
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
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      })
    );

    // AdminQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminQueryInput',
        fields: {
          entityTypes: { type: new GraphQLList(GraphQLString) },
          referencing: { type: GraphQLID },
          order: { type: GraphQLString }, // TODO should be enum?
        },
      })
    );

    // AdminReferenceInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminReferenceInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
      })
    );

    // AdminEntityVersionInfo
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityVersionInfo',
        fields: {
          version: { type: new GraphQLNonNull(GraphQLInt) },
          deleted: { type: new GraphQLNonNull(GraphQLBoolean) },
          published: { type: new GraphQLNonNull(GraphQLBoolean) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(GraphQLString) }, // TODO handle dates
        },
      })
    );

    // AdminEntityHistory
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityHistory',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          type: { type: new GraphQLNonNull(this.getType('EntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          versions: {
            type: new GraphQLNonNull(new GraphQLList(this.getType('AdminEntityVersionInfo'))),
          },
        },
      })
    );
  }

  addAdminEntityTypes(): void {
    for (const [entityName, entitySpec] of Object.entries(this.schema.spec.entityTypes)) {
      this.addAdminEntityType(entityName, entitySpec);
    }
  }

  addAdminEntityType(name: string, entitySpec: EntityTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<AdminEntity, TContext>({
        name: toAdminTypeName(name),
        interfaces: this.getInterfaces('AdminEntity'),
        isTypeOf: (source, unusedContext, unusedInfo) => source._type === name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _type: { type: new GraphQLNonNull(this.getType('EntityType')) },
            _name: { type: new GraphQLNonNull(GraphQLString) },
            _version: { type: new GraphQLNonNull(GraphQLInt) },
            _deleted: { type: new GraphQLNonNull(GraphQLBoolean) },
          };
          for (const fieldSpec of entitySpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case EntityFieldType.Reference:
                fieldType = this.getOrCreateEntityUnion(true, fieldSpec.entityTypes || []);
                break;
              case EntityFieldType.String:
                fieldType = GraphQLString;
                break;
              default:
                throw new Error(`Unexpected type (${fieldSpec.type})`);
            }
            fields[fieldSpec.name] = {
              type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
            };
          }
          return fields;
        },
      })
    );

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminCreateInputTypeName(name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            _type: { type: this.getEnumType('EntityType') },
            _name: { type: new GraphQLNonNull(GraphQLString) },
          };
          for (const fieldSpec of entitySpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case EntityFieldType.Reference:
                fieldType = this.getInputType('AdminReferenceInput');
                break;
              case EntityFieldType.String:
                fieldType = GraphQLString;
                break;
              default:
                throw new Error(`Unexpected type (${fieldSpec.type})`);
            }
            fields[fieldSpec.name] = {
              type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
            };
          }
          return fields;
        },
      })
    );

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminUpdateInputTypeName(name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _type: { type: this.getEnumType('EntityType') },
            _name: { type: GraphQLString },
          };
          for (const fieldSpec of entitySpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case EntityFieldType.Reference:
                fieldType = this.getInputType('AdminReferenceInput');
                break;
              case EntityFieldType.String:
                fieldType = GraphQLString;
                break;
              default:
                throw new Error(`Unexpected type (${fieldSpec.type})`);
            }
            fields[fieldSpec.name] = {
              type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
            };
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
        query?: AdminQuery;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('AdminEntityConnection'),
      args: {
        query: { type: this.getInputType('AdminQueryInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (source, args, context, unusedInfo) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadAdminSearchEntities(context, query, paging);
      },
    });
  }

  buildQueryFieldAdminEntityHistory<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('AdminEntityHistory'),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (source, args, context, unusedInfo) => {
        const { id } = args;
        return await loadVersionHistory(context, id);
      },
    });
  }

  buildQueryType<TSource>(): GraphQLObjectType {
    const includeEntities = Object.keys(this.schema.spec.entityTypes).length > 0;

    return new GraphQLObjectType<TSource, TContext>({
      name: 'Query',
      fields: {
        node: this.buildQueryFieldNode(),
        ...(includeEntities
          ? {
              adminEntity: this.buildQueryFieldAdminEntity(),
              adminEntityHistory: this.buildQueryFieldAdminEntityHistory(),
              adminSearchEntities: this.buildQueryFieldAdminSearchEntities(),
            }
          : {}),
      },
    });
  }

  buildMutationCreateEntity<TSource>(entityName: string): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        entity: AdminEntityCreate;
        publish: boolean;
      }
    >({
      type: new GraphQLNonNull(this.getType(toAdminTypeName(entityName))),
      args: {
        entity: { type: new GraphQLNonNull(this.getType(toAdminCreateInputTypeName(entityName))) },
        publish: { type: new GraphQLNonNull(GraphQLBoolean) },
      },
      resolve: async (source, args, context, unusedInfo) => {
        const { entity, publish } = args;
        if (entity._type && entity._type !== entityName) {
          throw notOk
            .BadRequest(`Specified type (entity._type=${entity._type}) should be ${entityName}`)
            .toError();
        }
        entity._type = entityName;
        return await Mutations.createEntity(context, entity, publish);
      },
    });
  }

  buildMutationUpdateEntity<TSource>(entityName: string): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        entity: AdminEntityUpdate;
        publish: boolean;
      }
    >({
      type: new GraphQLNonNull(this.getType(toAdminTypeName(entityName))),
      args: {
        entity: { type: new GraphQLNonNull(this.getType(toAdminUpdateInputTypeName(entityName))) },
        publish: { type: new GraphQLNonNull(GraphQLBoolean) },
      },
      resolve: async (source, args, context, unusedInfo) => {
        const { entity, publish } = args;
        if (entity._type && entity._type !== entityName) {
          throw notOk
            .BadRequest(`Specified type (entity._type=${entity._type}) should be ${entityName}`)
            .toError();
        }
        return await Mutations.updateEntity(context, entity, publish);
      },
    });
  }

  buildMutationDeleteEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        id: string;
        publish: boolean;
      }
    >({
      type: new GraphQLNonNull(this.getType('AdminEntity')),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        publish: { type: new GraphQLNonNull(GraphQLBoolean) },
      },
      resolve: async (source, args, context, unusedInfo) => {
        const { id, publish } = args;
        return await Mutations.deleteEntity(context, id, publish);
      },
    });
  }

  buildMutationType<TSource>(): GraphQLObjectType | null {
    const includeEntities = Object.keys(this.schema.spec.entityTypes).length > 0;
    if (!includeEntities) {
      return null;
    }

    const fields: GraphQLFieldConfigMap<TSource, TContext> = {
      deleteEntity: this.buildMutationDeleteEntity(),
    };

    for (const [entityType, unusedTypeSpec] of Object.entries(this.schema.spec.entityTypes)) {
      fields[`create${entityType}Entity`] = this.buildMutationCreateEntity(entityType);
      fields[`update${entityType}Entity`] = this.buildMutationUpdateEntity(entityType);
    }

    return new GraphQLObjectType<TSource, TContext>({
      name: 'Mutation',
      fields,
    });
  }

  buildSchemaConfig<TSource>(): GraphQLSchemaConfig {
    this.schema.validate().throwIfError();

    this.addSupportingTypes();
    this.addEntityTypes();
    this.addAdminSupportingTypes();
    this.addAdminEntityTypes();

    const queryType = this.buildQueryType<TSource>();
    const mutationType = this.buildMutationType<TSource>();

    return { query: queryType, mutation: mutationType, types: this.#types };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
