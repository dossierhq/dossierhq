import { ErrorType, FieldType, notOk, Value, ValueTypeSpecification } from '@datadata/core';
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

function toAdminTypeName(name: string, isAdmin = true) {
  return isAdmin ? 'Admin' + name : name;
}

function toAdminCreateInputTypeName(name: string) {
  return `Admin${name}CreateInput`;
}

function toAdminUpdateInputTypeName(name: string) {
  return `Admin${name}UpdateInput`;
}

function toAdminValueInputTypeName(name: string) {
  return `Admin${name}Input`;
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
      return this.getOutputType(toAdminTypeName('Entity', isAdmin));
    }

    // Remove duplicates, sort alphabetically
    const filteredNames = [...new Set(names)];
    filteredNames.sort();

    if (filteredNames.length === 1) {
      return this.getOutputType(toAdminTypeName(filteredNames[0], isAdmin));
    }

    const enumName = `$${toAdminTypeName(filteredNames.join('Or'), isAdmin)}`; // TODO change $ to _?
    const existingEnum = this.#types.find((x) => x.name === enumName);
    if (existingEnum) {
      if (isOutputType(existingEnum)) {
        return existingEnum;
      }
      throw new Error(`Type ${enumName} is not an output type`);
    }

    const enumValues: GraphQLEnumValueConfigMap = {};
    filteredNames.forEach((name) => (enumValues[toAdminTypeName(name, isAdmin)] = {}));
    const enumType = new GraphQLEnumType({
      name: enumName,
      values: enumValues,
    });

    this.addType(enumType);
    return enumType;
  }

  getOrCreateValueUnion(isAdmin: boolean, names: string[]): GraphQLOutputType {
    if (names.length === 0) {
      return this.getOutputType(toAdminTypeName('Value', isAdmin));
    }

    // Remove duplicates, sort alphabetically
    const filteredNames = [...new Set(names)];
    filteredNames.sort();

    if (filteredNames.length === 1) {
      return this.getOutputType(toAdminTypeName(filteredNames[0], isAdmin));
    }

    const enumName = `$${toAdminTypeName(filteredNames.join('Or'), isAdmin)}`;
    const existingEnum = this.#types.find((x) => x.name === enumName);
    if (existingEnum) {
      if (isOutputType(existingEnum)) {
        return existingEnum;
      }
      throw new Error(`Type ${enumName} is not an output type`);
    }

    const enumValues: GraphQLEnumValueConfigMap = {};
    filteredNames.forEach((name) => (enumValues[toAdminTypeName(name, isAdmin)] = {}));
    const enumType = new GraphQLEnumType({
      name: enumName,
      values: enumValues,
    });

    this.addType(enumType);
    return enumType;
  }

  getValueInputType(names: string[]): GraphQLInputType {
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length !== 1) {
      return GraphQLString; // JSON since there's no support for polymorphism on input types
    }

    return this.getInputType(toAdminValueInputTypeName(uniqueNames[0]));
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
    for (const entitySpec of this.schema.spec.entityTypes) {
      entityTypeEnumValues[entitySpec.name] = {};
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

    if (this.schema.getValueTypeCount() > 0) {
      // ValueType
      const valueTypeEnumValues: GraphQLEnumValueConfigMap = {};
      for (const valueSpec of this.schema.spec.valueTypes) {
        valueTypeEnumValues[valueSpec.name] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'ValueType',
          values: valueTypeEnumValues,
        })
      );

      // Value
      this.addType(
        new GraphQLInterfaceType({
          name: 'Value',
          fields: {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }
  }

  addEntityTypes(): void {
    for (const entitySpec of this.schema.spec.entityTypes) {
      this.addEntityType(entitySpec);
    }
  }

  addEntityType(entitySpec: EntityTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<Entity, TContext>({
        name: entitySpec.name,
        interfaces: this.getInterfaces('Node', 'Entity'),
        isTypeOf: (source, unusedContext, unusedInfo) => source._type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _name: { type: new GraphQLNonNull(GraphQLString) },
          };
          for (const fieldSpec of entitySpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case FieldType.EntityType:
                fieldType = this.getOrCreateEntityUnion(false, fieldSpec.entityTypes ?? []);
                break;
              case FieldType.String:
                fieldType = GraphQLString;
                break;
              case FieldType.ValueType:
                fieldType = this.getOrCreateValueUnion(false, fieldSpec.valueTypes ?? []);
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

  addValueTypes(): void {
    for (const valueSpec of this.schema.spec.valueTypes) {
      this.addValueType(valueSpec);
    }
  }

  addValueType(valueSpec: ValueTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<Value, TContext>({
        name: valueSpec.name,
        interfaces: this.getInterfaces('Value'),
        isTypeOf: (source, unusedContext, unusedInfo) => source._type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Value, TContext> = {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          };
          for (const fieldSpec of valueSpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case FieldType.EntityType:
                fieldType = this.getOrCreateEntityUnion(false, fieldSpec.entityTypes ?? []);
                break;
              case FieldType.String:
                fieldType = GraphQLString;
                break;
              case FieldType.ValueType:
                fieldType = this.getOrCreateValueUnion(false, fieldSpec.valueTypes ?? []);
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
          entityTypes: { type: new GraphQLList(this.getEnumType('EntityType')) },
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

    if (this.schema.getValueTypeCount() > 0) {
      // AdminValue
      this.addType(
        new GraphQLInterfaceType({
          name: 'AdminValue',
          fields: {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }

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
    for (const entitySpec of this.schema.spec.entityTypes) {
      this.addAdminEntityType(entitySpec);
    }
  }

  addAdminEntityType(entitySpec: EntityTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<AdminEntity, TContext>({
        name: toAdminTypeName(entitySpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Entity')),
        isTypeOf: (source, unusedContext, unusedInfo) => source._type === entitySpec.name,
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
              case FieldType.EntityType:
                fieldType = this.getOrCreateEntityUnion(true, fieldSpec.entityTypes ?? []);
                break;
              case FieldType.String:
                fieldType = GraphQLString;
                break;
              case FieldType.ValueType:
                fieldType = this.getOrCreateValueUnion(true, fieldSpec.valueTypes ?? []);
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
        name: toAdminCreateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            _type: { type: this.getEnumType('EntityType') },
            _name: { type: new GraphQLNonNull(GraphQLString) },
          };
          for (const fieldSpec of entitySpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case FieldType.EntityType:
                fieldType = this.getInputType('AdminReferenceInput');
                break;
              case FieldType.String:
                fieldType = GraphQLString;
                break;
              case FieldType.ValueType:
                fieldType = this.getValueInputType(fieldSpec.valueTypes ?? []);
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
        name: toAdminUpdateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _type: { type: this.getEnumType('EntityType') },
            _name: { type: GraphQLString },
          };
          for (const fieldSpec of entitySpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case FieldType.EntityType:
                fieldType = this.getInputType('AdminReferenceInput');
                break;
              case FieldType.String:
                fieldType = GraphQLString;
                break;
              case FieldType.ValueType:
                fieldType = this.getValueInputType(fieldSpec.valueTypes ?? []);
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

  addAdminValueTypes(): void {
    for (const valueSpec of this.schema.spec.valueTypes) {
      this.addAdminValueType(valueSpec);
    }
  }

  addAdminValueType(valueSpec: ValueTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<Value, TContext>({
        name: toAdminTypeName(valueSpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Value')),
        isTypeOf: (source, unusedContext, unusedInfo) => source._type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Value, TContext> = {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          };
          for (const fieldSpec of valueSpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case FieldType.EntityType:
                fieldType = this.getOrCreateEntityUnion(true, fieldSpec.entityTypes ?? []);
                break;
              case FieldType.String:
                fieldType = GraphQLString;
                break;
              case FieldType.ValueType:
                fieldType = this.getOrCreateValueUnion(true, fieldSpec.valueTypes ?? []);
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
        name: toAdminValueInputTypeName(valueSpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          };
          for (const fieldSpec of valueSpec.fields) {
            let fieldType;
            switch (fieldSpec.type) {
              case FieldType.EntityType:
                fieldType = this.getInputType('AdminReferenceInput');
                break;
              case FieldType.String:
                fieldType = GraphQLString;
                break;
              case FieldType.ValueType:
                fieldType = this.getValueInputType(fieldSpec.valueTypes ?? []);
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
    const includeEntities = this.schema.getEntityTypeCount() > 0;

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
    const includeEntities = this.schema.getEntityTypeCount() > 0;
    if (!includeEntities) {
      return null;
    }

    const fields: GraphQLFieldConfigMap<TSource, TContext> = {
      deleteEntity: this.buildMutationDeleteEntity(),
    };

    for (const entitySpec of this.schema.spec.entityTypes) {
      fields[`create${entitySpec.name}Entity`] = this.buildMutationCreateEntity(entitySpec.name);
      fields[`update${entitySpec.name}Entity`] = this.buildMutationUpdateEntity(entitySpec.name);
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
    this.addValueTypes();
    this.addAdminSupportingTypes();
    this.addAdminEntityTypes();
    this.addAdminValueTypes();

    const queryType = this.buildQueryType<TSource>();
    const mutationType = this.buildMutationType<TSource>();

    return { query: queryType, mutation: mutationType, types: this.#types };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
