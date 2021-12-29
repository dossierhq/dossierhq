import type {
  AdminClient,
  AdminEntity,
  AdminEntityCreate,
  AdminEntityTypeSpecification,
  AdminEntityUpdate,
  AdminEntityUpsert,
  AdminQuery,
  AdminSchema,
  AdminValueTypeSpecification,
  Entity,
  EntityReferenceWithAuthKeys,
  EntityTypeSpecification,
  EntityVersionReferenceWithAuthKeys,
  ErrorType,
  PublishedClient,
  Query,
  Result,
  Schema,
  ValueItem,
  ValueTypeSpecification,
} from '@jonasb/datadata-core';
import { FieldType, isItemValueItem, isValueTypeField, notOk } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import type {
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputType,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLSchemaConfig,
} from 'graphql';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  isEnumType,
  isInputType,
  isInterfaceType,
  isOutputType,
  Kind,
} from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import {
  loadAdminEntities,
  loadAdminEntity,
  loadAdminSearchEntities,
  loadEntities,
  loadEntity,
  loadPublishingHistory,
  loadSearchEntities,
  loadVersionHistory,
} from './DataLoaders';
import * as Mutations from './Mutations';
import { seemsLikeATemporalInstant } from './Utils';

export interface SessionGraphQLContext {
  adminClient: Result<AdminClient, ErrorType.NotAuthenticated>;
  publishedClient: Result<PublishedClient, ErrorType.NotAuthenticated>;
}

function toAdminTypeName(name: string, isAdmin = true) {
  return isAdmin ? 'Admin' + name : name;
}

function toAdminCreateInputTypeName(name: string) {
  return `Admin${name}CreateInput`;
}

function toAdminCreatePayloadTypeName(name: string) {
  return `Admin${name}CreatePayload`;
}

function toAdminUpdateInputTypeName(name: string) {
  return `Admin${name}UpdateInput`;
}

function toAdminUpdatePayloadTypeName(name: string) {
  return `Admin${name}UpdatePayload`;
}

function toAdminUpsertInputTypeName(name: string) {
  return `Admin${name}UpsertInput`;
}

function toAdminUpsertPayloadTypeName(name: string) {
  return `Admin${name}UpsertPayload`;
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
  private readonly adminSchema: AdminSchema | null;
  private readonly publishedSchema: Schema | null;

  constructor({
    adminSchema,
    publishedSchema,
  }: {
    adminSchema: AdminSchema | null;
    publishedSchema: Schema | null;
  }) {
    this.adminSchema = adminSchema;
    this.publishedSchema = publishedSchema;
  }

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

    const enumName = `_${toAdminTypeName(filteredNames.join('Or'), isAdmin)}`;
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

    const enumName = `_${toAdminTypeName(filteredNames.join('Or'), isAdmin)}`;
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

  getValueInputType(names: string[]): GraphQLInputType | null {
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length !== 1) {
      return null; //There's no support for polymorphism on input types
    }

    return this.getInputType(toAdminValueInputTypeName(uniqueNames[0]));
  }

  addSharedSupportingTypes(): void {
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

    // Instant
    this.addType(
      new GraphQLScalarType({
        name: 'Instant',
        serialize(value: unknown) {
          if (seemsLikeATemporalInstant(value)) {
            return value.toString();
          }
          throw new TypeError('Instant must be serialized from a Temporal.Instant.');
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.STRING) {
            return Temporal.Instant.from(ast.value);
          }
          throw new TypeError('Instant must be represented as a string.');
        },
        parseValue(value: unknown) {
          if (seemsLikeATemporalInstant(value)) {
            return value;
          }
          if (typeof value === 'string') {
            return Temporal.Instant.from(value);
          }
          throw new TypeError('Instant must be represented as a Temporal.Instant or string.');
        },
      })
    );

    const containsEntityTypes =
      (this.adminSchema && this.adminSchema.getEntityTypeCount() > 0) ||
      (this.publishedSchema && this.publishedSchema.getEntityTypeCount() > 0);
    if (!containsEntityTypes) {
      return;
    }

    // Location
    this.addType(
      new GraphQLObjectType({
        name: 'Location',
        fields: {
          lat: { type: new GraphQLNonNull(GraphQLFloat) },
          lng: { type: new GraphQLNonNull(GraphQLFloat) },
        },
      })
    );

    // LocationInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'LocationInput',
        fields: {
          lat: { type: new GraphQLNonNull(GraphQLFloat) },
          lng: { type: new GraphQLNonNull(GraphQLFloat) },
        },
      })
    );

    // BoundingBoxInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'BoundingBoxInput',
        fields: {
          minLat: { type: new GraphQLNonNull(GraphQLFloat) },
          maxLat: { type: new GraphQLNonNull(GraphQLFloat) },
          minLng: { type: new GraphQLNonNull(GraphQLFloat) },
          maxLng: { type: new GraphQLNonNull(GraphQLFloat) },
        },
      })
    );
  }

  addPublishedSupportingTypes(publishedSchema: Schema): void {
    if (publishedSchema.getEntityTypeCount() === 0) {
      return;
    }

    // EntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      entityTypeEnumValues[entitySpec.name] = {};
    }
    this.addType(
      new GraphQLEnumType({
        name: 'EntityType',
        values: entityTypeEnumValues,
      })
    );

    if (publishedSchema.getValueTypeCount() > 0) {
      // ValueType
      const valueTypeEnumValues: GraphQLEnumValueConfigMap = {};
      for (const valueSpec of publishedSchema.spec.valueTypes) {
        valueTypeEnumValues[valueSpec.name] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'ValueType',
          values: valueTypeEnumValues,
        })
      );
    }

    // EntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'EntityInfo',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
          authKey: { type: new GraphQLNonNull(GraphQLString) },
          createdAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );

    // Entity
    this.addType(
      new GraphQLInterfaceType({
        name: 'Entity',
        interfaces: this.getInterfaces('Node'),
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          info: { type: new GraphQLNonNull(this.getOutputType('EntityInfo')) },
        },
      })
    );

    if (publishedSchema.getValueTypeCount() > 0) {
      // Value
      this.addType(
        new GraphQLInterfaceType({
          name: 'Value',
          fields: {
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }

    // RichText
    this.addType(
      new GraphQLObjectType({
        name: 'RichText',
        fields: {
          blocks: { type: new GraphQLNonNull(GraphQLJSON) },
          entities: { type: new GraphQLList(this.getInterface('Entity')) },
        },
      })
    );

    // EntityEdge
    this.addType(
      new GraphQLObjectType({
        name: 'EntityEdge',
        fields: {
          node: { type: this.getOutputType('Entity') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // EntityConnection
    this.addType(
      new GraphQLObjectType({
        name: 'EntityConnection',
        fields: {
          pageInfo: { type: new GraphQLNonNull(this.getOutputType('PageInfo')) },
          edges: { type: new GraphQLList(this.getOutputType('EntityEdge')) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      })
    );

    // QueryOrder
    this.addType(
      new GraphQLEnumType({
        name: 'QueryOrder',
        values: { createdAt: {}, name: {} },
      })
    );

    // QueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'QueryInput',
        fields: {
          authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
          entityTypes: {
            type: new GraphQLList(new GraphQLNonNull(this.getEnumType('EntityType'))),
          },
          referencing: { type: GraphQLID },
          boundingBox: { type: this.getInputType('BoundingBoxInput') },
          order: { type: this.getEnumType('QueryOrder') },
          reverse: { type: GraphQLBoolean },
          text: { type: GraphQLString },
        },
      })
    );
  }

  addEntityTypes(publishedSchema: Schema): void {
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      this.addEntityType(entitySpec);
    }
  }

  addEntityType(entitySpec: EntityTypeSpecification): void {
    const fieldsTypeName = `${entitySpec.name}Fields`;
    if (entitySpec.fields.length > 0) {
      this.addType(
        new GraphQLObjectType<Entity, TContext>({
          name: fieldsTypeName,
          fields: () => {
            const fields: GraphQLFieldConfigMap<Entity, TContext> = {};
            this.addTypeSpecificationOutputFields(entitySpec, fields, false);
            return fields;
          },
        })
      );
    }

    this.addType(
      new GraphQLObjectType<Entity, TContext>({
        name: entitySpec.name,
        interfaces: this.getInterfaces('Node', 'Entity'),
        isTypeOf: (source, _context, _info) => source.info.type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: new GraphQLNonNull(this.getOutputType('EntityInfo')) },
          };
          if (entitySpec.fields.length > 0) {
            fields.fields = { type: new GraphQLNonNull(this.getOutputType(fieldsTypeName)) };
          }
          return fields;
        },
      })
    );
  }

  addValueTypes(publishedSchema: Schema): void {
    for (const valueSpec of publishedSchema.spec.valueTypes) {
      this.addValueType(valueSpec);
    }
  }

  addValueType(valueSpec: ValueTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<ValueItem, TContext>({
        name: valueSpec.name,
        interfaces: this.getInterfaces('Value'),
        isTypeOf: (source, _context, _info) => source.type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<ValueItem, TContext> = {
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          };
          this.addTypeSpecificationOutputFields(valueSpec, fields, false);
          return fields;
        },
      })
    );
  }

  addAdminSupportingTypes(adminSchema: AdminSchema): void {
    if (adminSchema.getEntityTypeCount() === 0) {
      return;
    }

    // AdminEntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const entitySpec of adminSchema.spec.entityTypes) {
      entityTypeEnumValues[entitySpec.name] = {};
    }
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityType',
        values: entityTypeEnumValues,
      })
    );

    if (adminSchema.getValueTypeCount() > 0) {
      // AdminValueType
      const valueTypeEnumValues: GraphQLEnumValueConfigMap = {};
      for (const valueSpec of adminSchema.spec.valueTypes) {
        valueTypeEnumValues[valueSpec.name] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'AdminValueType',
          values: valueTypeEnumValues,
        })
      );
    }

    // AdminEntityStatus
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityStatus',
        values: {
          draft: {},
          published: {},
          modified: {},
          withdrawn: {},
          archived: {},
        },
      })
    );

    // AdminEntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityInfo',
        fields: {
          type: { type: new GraphQLNonNull(this.getOutputType('AdminEntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
          authKey: { type: new GraphQLNonNull(GraphQLString) },
          status: { type: new GraphQLNonNull(this.getOutputType('AdminEntityStatus')) },
          createdAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );

    // AdminEntityCreateInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntityCreateInfo',
        fields: {
          type: { type: this.getEnumType('AdminEntityType') },
          name: { type: new GraphQLNonNull(GraphQLString) },
          version: { type: GraphQLInt },
          authKey: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // AdminEntityCreateEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityCreateEffect',
        values: {
          created: {},
          none: {},
        },
      })
    );

    // AdminEntityUpdateInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntityUpdateInfo',
        fields: {
          type: { type: this.getEnumType('AdminEntityType') },
          name: { type: GraphQLString },
          version: { type: GraphQLInt },
          authKey: { type: GraphQLString },
        },
      })
    );

    // AdminEntityUpdateEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityUpdateEffect',
        values: {
          updated: {},
          none: {},
        },
      })
    );

    // AdminEntityUpsertInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntityUpsertInfo',
        fields: {
          type: { type: new GraphQLNonNull(this.getEnumType('AdminEntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          authKey: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // AdminEntityUpsertEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityUpsertEffect',
        values: {
          created: {},
          updated: {},
          none: {},
        },
      })
    );

    // AdminEntity
    this.addType(
      new GraphQLInterfaceType({
        name: 'AdminEntity',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          info: { type: new GraphQLNonNull(this.getOutputType('AdminEntityInfo')) },
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
          pageInfo: { type: new GraphQLNonNull(this.getOutputType('PageInfo')) },
          edges: { type: new GraphQLList(this.getOutputType('AdminEntityEdge')) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      })
    );

    // AdminQueryOrder
    this.addType(
      new GraphQLEnumType({
        name: 'AdminQueryOrder',
        values: { createdAt: {}, updatedAt: {}, name: {} },
      })
    );

    // AdminQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminQueryInput',
        fields: {
          authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
          entityTypes: {
            type: new GraphQLList(new GraphQLNonNull(this.getEnumType('AdminEntityType'))),
          },
          referencing: { type: GraphQLID },
          boundingBox: { type: this.getInputType('BoundingBoxInput') },
          order: { type: this.getEnumType('AdminQueryOrder') },
          reverse: { type: GraphQLBoolean },
          text: { type: GraphQLString },
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

    // EntityReferenceWithAuthKeysInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityReferenceWithAuthKeysInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        },
      })
    );

    // EntityVersionReferenceWithAuthKeysInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityVersionReferenceWithAuthKeysInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
          authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        },
      })
    );

    if (this.adminSchema && this.adminSchema.getValueTypeCount() > 0) {
      // AdminValue
      this.addType(
        new GraphQLInterfaceType({
          name: 'AdminValue',
          fields: {
            type: { type: new GraphQLNonNull(this.getEnumType('AdminValueType')) },
          },
        })
      );
    }

    // AdminRichText
    this.addType(
      new GraphQLObjectType({
        name: 'AdminRichText',
        fields: {
          blocks: { type: new GraphQLNonNull(GraphQLJSON) },
          entities: { type: new GraphQLList(this.getInterface('AdminEntity')) },
        },
      })
    );

    // AdminRichTextInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminRichTextInput',
        fields: {
          blocks: { type: new GraphQLNonNull(GraphQLJSON) },
        },
      })
    );

    // EntityVersionInfo
    this.addType(
      new GraphQLObjectType({
        name: 'EntityVersionInfo',
        fields: {
          version: { type: new GraphQLNonNull(GraphQLInt) },
          published: { type: new GraphQLNonNull(GraphQLBoolean) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );

    // EntityHistory
    this.addType(
      new GraphQLObjectType({
        name: 'EntityHistory',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          versions: {
            type: new GraphQLNonNull(new GraphQLList(this.getOutputType('EntityVersionInfo'))),
          },
        },
      })
    );

    // PublishingEvent
    this.addType(
      new GraphQLObjectType({
        name: 'PublishingEvent',
        fields: {
          version: { type: GraphQLInt },
          publishedBy: { type: new GraphQLNonNull(GraphQLID) },
          publishedAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );

    // PublishingHistory
    this.addType(
      new GraphQLObjectType({
        name: 'PublishingHistory',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          events: {
            type: new GraphQLNonNull(new GraphQLList(this.getOutputType('PublishingEvent'))),
          },
        },
      })
    );

    // AdminEntityPublishEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityPublishEffect',
        values: {
          published: {},
          none: {},
        },
      })
    );

    // AdminEntityPublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityPublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('AdminEntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityPublishEffect')) },
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );

    // AdminEntityUnpublishEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityUnpublishEffect',
        values: {
          unpublished: {},
          none: {},
        },
      })
    );

    // AdminEntityUnpublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityUnpublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('AdminEntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityUnpublishEffect')) },
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );

    // AdminEntityArchiveEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityArchiveEffect',
        values: {
          archived: {},
          none: {},
        },
      })
    );

    // AdminEntityArchivePayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityArchivePayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('AdminEntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityArchiveEffect')) },
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );

    // AdminEntityUnarchiveEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityUnarchiveEffect',
        values: {
          unarchived: {},
          none: {},
        },
      })
    );

    // AdminEntityUnarchivePayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityUnarchivePayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('AdminEntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityUnarchiveEffect')) },
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('Instant')) },
        },
      })
    );
  }

  addAdminEntityTypes(adminSchema: AdminSchema): void {
    for (const entitySpec of adminSchema.spec.entityTypes) {
      this.addAdminEntityType(entitySpec);
    }
  }

  addAdminEntityType(entitySpec: AdminEntityTypeSpecification): void {
    // AdminFooFields
    const fieldsName =
      entitySpec.fields.length > 0 ? `${toAdminTypeName(entitySpec.name)}Fields` : null;
    if (fieldsName) {
      this.addType(
        new GraphQLObjectType<AdminEntity['fields'], TContext>({
          name: fieldsName,
          fields: () => {
            const fields: GraphQLFieldConfigMap<AdminEntity['fields'], TContext> = {};
            this.addTypeSpecificationOutputFields(entitySpec, fields, true);
            return fields;
          },
        })
      );
    }

    // AdminFoo
    this.addType(
      new GraphQLObjectType<AdminEntity, TContext>({
        name: toAdminTypeName(entitySpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Entity')),
        isTypeOf: (source, _context, _info) => source.info.type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: new GraphQLNonNull(this.getOutputType('AdminEntityInfo')) },
          };
          if (fieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getOutputType(fieldsName)) };
          }
          return fields;
        },
      })
    );

    // AdminFooFieldsInput
    const inputFieldsName =
      entitySpec.fields.length > 0 ? `${toAdminTypeName(entitySpec.name)}FieldsInput` : null;
    if (inputFieldsName) {
      this.addType(
        new GraphQLInputObjectType({
          name: inputFieldsName,
          fields: () => {
            const fields: GraphQLInputFieldConfigMap = {};
            this.addTypeSpecificationInputFields(entitySpec, fields);
            return fields;
          },
        })
      );
    }

    // AdminFooCreateInput
    this.addType(
      new GraphQLInputObjectType({
        name: toAdminCreateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: GraphQLID },
            info: { type: new GraphQLNonNull(this.getInputType('AdminEntityCreateInfo')) },
          };
          if (inputFieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getInputType(inputFieldsName)) };
          }
          return fields;
        },
      })
    );

    // AdminFooCreatePayload
    this.addType(
      new GraphQLObjectType({
        name: toAdminCreatePayloadTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityCreateEffect')) },
            entity: {
              type: new GraphQLNonNull(this.getOutputType(toAdminTypeName(entitySpec.name))),
            },
          };
          return fields;
        },
      })
    );

    // AdminFooUpdateInput
    this.addType(
      new GraphQLInputObjectType({
        name: toAdminUpdateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: this.getInputType('AdminEntityUpdateInfo') },
          };
          if (inputFieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getInputType(inputFieldsName)) };
          }
          return fields;
        },
      })
    );

    // AdminFooUpdatePayload
    this.addType(
      new GraphQLObjectType({
        name: toAdminUpdatePayloadTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityUpdateEffect')) },
            entity: {
              type: new GraphQLNonNull(this.getOutputType(toAdminTypeName(entitySpec.name))),
            },
          };
          return fields;
        },
      })
    );

    // AdminFooUpsertInput
    this.addType(
      new GraphQLInputObjectType({
        name: toAdminUpsertInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: new GraphQLNonNull(this.getInputType('AdminEntityUpsertInfo')) },
          };
          if (inputFieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getInputType(inputFieldsName)) };
          }
          return fields;
        },
      })
    );

    // AdminFooUpsertPayload
    this.addType(
      new GraphQLObjectType({
        name: toAdminUpsertPayloadTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityUpsertEffect')) },
            entity: {
              type: new GraphQLNonNull(this.getOutputType(toAdminTypeName(entitySpec.name))),
            },
          };
          return fields;
        },
      })
    );
  }

  addAdminValueTypes(adminSchema: AdminSchema): void {
    for (const valueSpec of adminSchema.spec.valueTypes) {
      this.addAdminValueType(valueSpec);
    }
  }

  addAdminValueType(valueSpec: AdminValueTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<ValueItem, TContext>({
        name: toAdminTypeName(valueSpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Value')),
        isTypeOf: (source, _context, _info) => source.type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<ValueItem, TContext> = {
            type: { type: new GraphQLNonNull(this.getEnumType('AdminValueType')) },
          };
          this.addTypeSpecificationOutputFields(valueSpec, fields, true);
          return fields;
        },
      })
    );

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminValueInputTypeName(valueSpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            type: { type: new GraphQLNonNull(this.getEnumType('AdminValueType')) },
          };
          this.addTypeSpecificationInputFields(valueSpec, fields);
          return fields;
        },
      })
    );
  }

  addTypeSpecificationOutputFields<TSource>(
    typeSpec: EntityTypeSpecification | AdminEntityTypeSpecification | AdminValueTypeSpecification,
    fields: GraphQLFieldConfigMap<TSource, TContext>,
    isAdmin: boolean
  ): void {
    for (const fieldSpec of typeSpec.fields) {
      let fieldType;
      switch (fieldSpec.type as FieldType) {
        case FieldType.Boolean:
          fieldType = GraphQLBoolean;
          break;
        case FieldType.EntityType:
          //TODO ability to specify authKeys?
          fieldType = this.getOrCreateEntityUnion(isAdmin, fieldSpec.entityTypes ?? []);
          break;
        case FieldType.Location:
          fieldType = this.getOutputType('Location');
          break;
        case FieldType.RichText:
          fieldType = this.getOutputType(toAdminTypeName('RichText', isAdmin));
          break;
        case FieldType.String:
          fieldType = GraphQLString;
          break;
        case FieldType.ValueType:
          fieldType = this.getOrCreateValueUnion(isAdmin, fieldSpec.valueTypes ?? []);
          break;
        default:
          throw new Error(`Unexpected type (${fieldSpec.type})`);
      }

      if (fieldSpec.list) {
        fieldType = new GraphQLList(new GraphQLNonNull(fieldType));
      }
      if (fieldSpec.required && !isAdmin) {
        fieldType = new GraphQLNonNull(fieldType);
      }

      fields[fieldSpec.name] = { type: fieldType };
    }
  }

  addTypeSpecificationInputFields(
    typeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification,
    fields: GraphQLInputFieldConfigMap
  ): void {
    for (const fieldSpec of typeSpec.fields) {
      let fieldType;
      switch (fieldSpec.type) {
        case FieldType.Boolean:
          fieldType = GraphQLBoolean;
          break;
        case FieldType.EntityType:
          fieldType = this.getInputType('AdminReferenceInput');
          break;
        case FieldType.Location:
          fieldType = this.getInputType('LocationInput');
          break;
        case FieldType.RichText:
          fieldType = this.getInputType('AdminRichTextInput');
          break;
        case FieldType.String:
          fieldType = GraphQLString;
          break;
        case FieldType.ValueType: {
          //TODO use GraphQLJSON. Is it still needed or is normal fieldType enough?
          fields[`${fieldSpec.name}Json`] = { type: GraphQLString };

          fieldType = this.getValueInputType(fieldSpec.valueTypes ?? []);
          break;
        }
        default:
          throw new Error(`Unexpected type (${fieldSpec.type})`);
      }

      if (fieldType) {
        fields[fieldSpec.name] = {
          type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
        };
      }
    }
  }

  buildQueryFieldNode<TSource>(publishedSchema: Schema): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getInterface('Node'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadEntity(publishedSchema, context, args.id);
      },
    });
  }

  buildQueryFieldNodes<TSource>(publishedSchema: Schema): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('Node')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadEntities(publishedSchema, context, args.ids);
      },
    });
  }

  buildQueryFieldAdminEntity<TSource>(
    adminSchema: AdminSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { id: string; version: number | null; authKeys: string[] | null }
    >({
      type: this.getInterface('AdminEntity'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        version: { type: GraphQLInt },
        authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadAdminEntity(adminSchema, context, args.id, args.version, args.authKeys);
      },
    });
  }

  buildQueryFieldAdminEntities<TSource>(
    adminSchema: AdminSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('AdminEntity')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadAdminEntities(adminSchema, context, args.ids);
      },
    });
  }

  buildQueryFieldAdminSearchEntities<TSource>(
    adminSchema: AdminSchema
  ): GraphQLFieldConfig<TSource, TContext> {
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
      resolve: async (_source, args, context, _info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadAdminSearchEntities(adminSchema, context, query, paging);
      },
    });
  }

  buildQueryFieldSearchEntities<TSource>(
    publishedSchema: Schema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: Query;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('EntityConnection'),
      args: {
        query: { type: this.getInputType('QueryInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (_source, args, context, _info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadSearchEntities(publishedSchema, context, query, paging);
      },
    });
  }

  buildQueryFieldEntityHistory<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; authKeys: string[] | null }>({
      type: this.getOutputType('EntityHistory'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      },
      resolve: async (source, args, context, _info) => {
        const { id, authKeys } = args;
        return await loadVersionHistory(context, { id, authKeys: authKeys ?? undefined });
      },
    });
  }

  buildQueryFieldPublishingHistory<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; authKeys: string[] | null }>({
      type: this.getOutputType('PublishingHistory'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id, authKeys } = args;
        return await loadPublishingHistory(context, { id, authKeys: authKeys ?? undefined });
      },
    });
  }

  buildQueryType<TSource>(): GraphQLObjectType {
    return new GraphQLObjectType<TSource, TContext>({
      name: 'Query',
      fields: {
        ...(this.publishedSchema && this.publishedSchema.getEntityTypeCount() > 0
          ? {
              node: this.buildQueryFieldNode(this.publishedSchema),
              nodes: this.buildQueryFieldNodes(this.publishedSchema),
              searchEntities: this.buildQueryFieldSearchEntities(this.publishedSchema),
            }
          : {}),
        ...(this.adminSchema && this.adminSchema.getEntityTypeCount() > 0
          ? {
              adminEntity: this.buildQueryFieldAdminEntity(this.adminSchema),
              adminEntities: this.buildQueryFieldAdminEntities(this.adminSchema),
              adminSearchEntities: this.buildQueryFieldAdminSearchEntities(this.adminSchema),
              entityHistory: this.buildQueryFieldEntityHistory(),
              publishingHistory: this.buildQueryFieldPublishingHistory(),
            }
          : {}),
      },
    });
  }

  buildMutationCreateEntity<TSource>(
    adminSchema: AdminSchema,
    entityName: string
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { entity: AdminEntityCreate }>({
      type: this.getOutputType(toAdminCreatePayloadTypeName(entityName)),
      args: {
        entity: {
          type: new GraphQLNonNull(this.getInputType(toAdminCreateInputTypeName(entityName))),
        },
      },
      resolve: async (_source, args, context, _info) => {
        const { entity } = args;
        if (entity.info.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        entity.info.type = entityName;
        this.resolveJsonInputFields(adminSchema, entity, entityName);
        return await Mutations.createEntity(adminSchema, context, entity);
      },
    });
  }

  buildMutationUpdateEntity<TSource>(
    adminSchema: AdminSchema,
    entityName: string
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { entity: AdminEntityUpdate }>({
      type: this.getOutputType(toAdminUpdatePayloadTypeName(entityName)),
      args: {
        entity: {
          type: new GraphQLNonNull(this.getInputType(toAdminUpdateInputTypeName(entityName))),
        },
      },
      resolve: async (_source, args, context, _info) => {
        const { entity } = args;
        if (entity.info?.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        this.resolveJsonInputFields(adminSchema, entity, entityName);
        return await Mutations.updateEntity(adminSchema, context, entity);
      },
    });
  }

  buildMutationUpsertEntity<TSource>(
    adminSchema: AdminSchema,
    entityName: string
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { entity: AdminEntityUpsert }>({
      type: this.getOutputType(toAdminUpsertPayloadTypeName(entityName)),
      args: {
        entity: {
          type: new GraphQLNonNull(this.getInputType(toAdminUpsertInputTypeName(entityName))),
        },
      },
      resolve: async (_source, args, context, _info) => {
        const { entity } = args;
        if (entity.info?.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        this.resolveJsonInputFields(adminSchema, entity, entityName);
        return await Mutations.upsertEntity(adminSchema, context, entity);
      },
    });
  }

  resolveJsonInputFields(
    adminSchema: AdminSchema,
    entity: AdminEntityCreate | AdminEntityUpdate,
    entityTypeName: string
  ): void {
    const visitItem = (
      item: AdminEntityCreate | AdminEntityUpdate | ValueItem,
      typeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification,
      prefix: string,
      isEntity: boolean
    ) => {
      const isValueItem = isItemValueItem(item);
      const fields = isValueItem ? item : item.fields ?? {};
      for (const fieldName of Object.keys(fields)) {
        // Skip standard fields
        if (isValueItem && fieldName === 'type') {
          continue;
        }
        const fieldPrefix = isValueItem
          ? `${prefix}.${fieldName}`
          : `${prefix}.fields.${fieldName}`;
        const fieldValue = fields[fieldName];

        // Decode JSON value item fields
        if (fieldName.endsWith('Json')) {
          const fieldNameWithoutJson = fieldName.slice(0, -'Json'.length);
          const decodedValue = this.decodeJsonInputField(fieldPrefix, fieldValue);

          delete fields[fieldName];
          fields[fieldNameWithoutJson] = decodedValue;
          continue;
        }

        const fieldSpec = isEntity
          ? adminSchema.getEntityFieldSpecification(typeSpec, fieldName)
          : adminSchema.getValueFieldSpecification(typeSpec, fieldName);

        // Traverse into value items
        if (fieldSpec && isValueTypeField(fieldSpec, fieldValue) && fieldValue) {
          const type = fieldValue.type;
          const valueSpec = adminSchema.getValueTypeSpecification(type);
          if (!valueSpec) {
            throw new Error(`${fieldPrefix}: No such type ${type}`);
          }

          visitItem(fieldValue, valueSpec, fieldPrefix, false);
        }
      }
    };

    const entitySpec = adminSchema.getEntityTypeSpecification(entityTypeName);
    if (!entitySpec) {
      throw new Error(`No such entity type ${entityTypeName}`);
    }
    visitItem(entity, entitySpec, 'entity', true);
  }

  decodeJsonInputField(fieldPrefix: string, fieldValue: unknown): unknown {
    if (fieldValue === null) {
      return null;
    }
    if (fieldValue === undefined) {
      return undefined;
    }

    if (typeof fieldValue !== 'string') {
      throw new Error(`${fieldPrefix}: Expected string, got ${typeof fieldValue}`);
    }
    try {
      return JSON.parse(fieldValue);
    } catch (error) {
      throw new Error(
        `${fieldPrefix}: Failed parsing JSON: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  buildMutationPublishEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { references: EntityVersionReferenceWithAuthKeys[] }
    >({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('AdminEntityPublishPayload'))),
      args: {
        references: {
          type: new GraphQLNonNull(
            new GraphQLList(
              new GraphQLNonNull(this.getInputType('EntityVersionReferenceWithAuthKeysInput'))
            )
          ),
        },
      },
      resolve: async (_source, args, context, _info) => {
        const { references } = args;
        return await Mutations.publishEntities(context, references);
      },
    });
  }

  buildMutationUnpublishEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { references: EntityReferenceWithAuthKeys[] }>({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('AdminEntityUnpublishPayload'))),
      args: {
        references: {
          type: new GraphQLNonNull(
            new GraphQLList(
              new GraphQLNonNull(this.getInputType('EntityReferenceWithAuthKeysInput'))
            )
          ),
        },
      },
      resolve: async (_source, args, context, _info) => {
        const { references } = args;
        return await Mutations.unpublishEntities(context, references);
      },
    });
  }

  buildMutationArchiveEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; authKeys: string[] | null }>({
      type: this.getOutputType('AdminEntityArchivePayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id, authKeys } = args;
        return await Mutations.archiveEntity(context, { id, authKeys: authKeys ?? undefined });
      },
    });
  }

  buildMutationUnarchiveEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; authKeys: string[] | null }>({
      type: this.getOutputType('AdminEntityUnarchivePayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id, authKeys } = args;
        return await Mutations.unarchiveEntity(context, { id, authKeys: authKeys ?? undefined });
      },
    });
  }

  buildMutationType<TSource>(adminSchema: AdminSchema): GraphQLObjectType | null {
    const includeEntities = adminSchema.getEntityTypeCount() > 0;
    if (!includeEntities) {
      return null;
    }

    const fields: GraphQLFieldConfigMap<TSource, TContext> = {
      publishEntities: this.buildMutationPublishEntities(),
      unpublishEntities: this.buildMutationUnpublishEntities(),
      archiveEntity: this.buildMutationArchiveEntity(),
      unarchiveEntity: this.buildMutationUnarchiveEntity(),
    };

    for (const entitySpec of adminSchema.spec.entityTypes) {
      fields[`create${entitySpec.name}Entity`] = this.buildMutationCreateEntity(
        adminSchema,
        entitySpec.name
      );
      fields[`update${entitySpec.name}Entity`] = this.buildMutationUpdateEntity(
        adminSchema,
        entitySpec.name
      );
      fields[`upsert${entitySpec.name}Entity`] = this.buildMutationUpsertEntity(
        adminSchema,
        entitySpec.name
      );
    }

    return new GraphQLObjectType<TSource, TContext>({
      name: 'Mutation',
      fields,
    });
  }

  buildSchemaConfig<TSource>(): GraphQLSchemaConfig {
    this.addSharedSupportingTypes();

    if (this.publishedSchema) {
      this.addPublishedSupportingTypes(this.publishedSchema);
      this.addEntityTypes(this.publishedSchema);
      this.addValueTypes(this.publishedSchema);
    }
    if (this.adminSchema) {
      this.addAdminSupportingTypes(this.adminSchema);
      this.addAdminEntityTypes(this.adminSchema);
      this.addAdminValueTypes(this.adminSchema);
    }

    const queryType = this.buildQueryType<TSource>();
    let mutationType: GraphQLObjectType | null = null;
    if (this.adminSchema) {
      mutationType = this.buildMutationType<TSource>(this.adminSchema);
    }

    return { query: queryType, mutation: mutationType, types: this.#types };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
