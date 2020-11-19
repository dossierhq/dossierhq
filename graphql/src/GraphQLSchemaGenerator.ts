import { EntityAdmin, EntityFieldType, ErrorType, PublishedEntity } from '@datadata/core';
import type {
  AdminEntity,
  Entity,
  EntityTypeSpecification,
  Result,
  Schema,
  SessionContext,
} from '@datadata/core';
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  isInterfaceType,
} from 'graphql';
import type {
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLNamedType,
  GraphQLSchemaConfig,
} from 'graphql';

export interface SessionGraphQLContext {
  context: Result<SessionContext, ErrorType.NotAuthenticated>;
}

function toAdminTypeName(name: string) {
  return 'Admin' + name;
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
    return {
      type: this.getInterface('Node'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (unusedSource, { id }, context) => {
        if (context.context.isError()) {
          throw context.context.toError();
        }
        const result = await PublishedEntity.getEntity(context.context.value, id);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value.item;
      },
    };
  }

  buildQueryFieldAdminEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> | null {
    if (Object.keys(this.schema.spec.entityTypes).length === 0) {
      return null;
    }
    return {
      type: this.getInterface('AdminEntity'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        version: { type: GraphQLInt },
      },
      resolve: async (unusedSource, { id, version }, context) => {
        if (context.context.isError()) {
          throw context.context.toError();
        }
        const result = await EntityAdmin.getEntity(context.context.value, id, { version });
        if (result.isError()) {
          throw result.toError();
        }
        return result.value.item;
      },
    };
  }

  buildSchemaConfig<TSource>(): GraphQLSchemaConfig {
    this.addSupportingTypes();
    this.addEntityTypes();
    this.addAdminSupportingTypes();
    this.addAdminEntityTypes();

    const node = this.buildQueryFieldNode<TSource>();
    const adminEntity = this.buildQueryFieldAdminEntity();

    const fields: GraphQLFieldConfigMap<TSource, TContext> = { node };
    if (adminEntity) {
      fields.adminEntity = adminEntity;
    }

    const queryType = new GraphQLObjectType<TSource, TContext>({
      name: 'Query',
      fields,
    });
    return { query: queryType, types: this.#types };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
