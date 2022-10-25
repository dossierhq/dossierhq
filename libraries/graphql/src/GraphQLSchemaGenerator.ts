import type {
  AdminClient,
  AdminEntity,
  AdminEntityCreate,
  AdminEntityTypeSpecification,
  AdminEntityUpdate,
  AdminEntityUpsert,
  AdminQuery,
  AdminSchema,
  AdminSearchQuery,
  AdminValueTypeSpecification,
  AdvisoryLockOptions,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PublishedClient,
  PublishedEntity,
  PublishedEntityTypeSpecification,
  PublishedQuery,
  PublishedSchema,
  PublishedSearchQuery,
  PublishedValueTypeSpecification,
  Result,
  ValueItem,
} from '@jonasb/datadata-core';
import { FieldType, isItemValueItem, isValueTypeField, notOk } from '@jonasb/datadata-core';
import type {
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
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
  Kind,
} from 'graphql';
import {
  loadAdminEntities,
  loadAdminEntity,
  loadAdminSampleEntities,
  loadAdminSearchEntities,
  loadPublishedEntities,
  loadPublishedEntity,
  loadPublishedSampleEntities,
  loadPublishingHistory,
  loadSearchEntities,
  loadVersionHistory,
} from './DataLoaders.js';
import * as Mutations from './Mutations.js';
import {
  toAdminCreateInputTypeName,
  toAdminCreatePayloadTypeName,
  toAdminTypeName,
  toAdminUpdateInputTypeName,
  toAdminUpdatePayloadTypeName,
  toAdminUpsertInputTypeName,
  toAdminUpsertPayloadTypeName,
  toAdminValueInputTypeName,
  toPublishedTypeName,
} from './NameGenerator.js';
import { TypeRepository } from './TypeRepository.js';
import { GraphQLJSON } from './vendor/GraphQLScalar.js';

export interface SessionGraphQLContext {
  adminClient: Result<AdminClient, typeof ErrorType.NotAuthenticated>;
  publishedClient: Result<PublishedClient, typeof ErrorType.NotAuthenticated>;
}

function fieldConfigWithArgs<TSource, TContext, TArgs>(
  config: GraphQLFieldConfig<TSource, TContext, TArgs>
): GraphQLFieldConfig<TSource, TContext> {
  return config as GraphQLFieldConfig<TSource, TContext>;
}

export class GraphQLSchemaGenerator<TContext extends SessionGraphQLContext> extends TypeRepository {
  private readonly adminSchema: AdminSchema | null;
  private readonly publishedSchema: PublishedSchema | null;

  constructor({
    adminSchema,
    publishedSchema,
  }: {
    adminSchema: AdminSchema | null;
    publishedSchema: PublishedSchema | null;
  }) {
    super();
    this.adminSchema = adminSchema;
    this.publishedSchema = publishedSchema;
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

    // DateTime
    this.addType(
      new GraphQLScalarType({
        name: 'DateTime',
        serialize(value: unknown) {
          if (value instanceof Date) {
            return value.toISOString();
          }
          throw new TypeError('DateTime must be serialized from a Date.');
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
          }
          throw new TypeError('DateTime must be represented as a string.');
        },
        parseValue(value: unknown) {
          if (value instanceof Date) {
            return value;
          }
          if (typeof value === 'string') {
            return new Date(value);
          }
          throw new TypeError('DateTime must be represented as a Date or string.');
        },
      })
    );

    const containsEntityTypes =
      (this.adminSchema && this.adminSchema.getEntityTypeCount() > 0) ||
      (this.publishedSchema && this.publishedSchema.getEntityTypeCount() > 0);
    if (!containsEntityTypes) {
      return;
    }

    // EntityReferenceInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityReferenceInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
      })
    );

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

  addPublishedSupportingTypes(publishedSchema: PublishedSchema): void {
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

    // PublishedEntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'PublishedEntityInfo',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
          authKey: { type: new GraphQLNonNull(GraphQLString) },
          createdAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
        },
      })
    );

    // PublishedEntity
    this.addType(
      new GraphQLInterfaceType({
        name: 'PublishedEntity',
        interfaces: this.getInterfaces('Node'),
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          info: { type: new GraphQLNonNull(this.getOutputType('PublishedEntityInfo')) },
        },
      })
    );

    if (publishedSchema.getValueTypeCount() > 0) {
      // PublishedValue
      this.addType(
        new GraphQLInterfaceType({
          name: toPublishedTypeName('Value'),
          fields: {
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }

    // PublishedRichText
    this.addType(
      new GraphQLObjectType({
        name: 'PublishedRichText',
        fields: {
          root: { type: new GraphQLNonNull(GraphQLJSON) },
          entities: { type: new GraphQLList(this.getInterface('PublishedEntity')) },
        },
      })
    );

    // PublishedUniqueIndex
    const uniqueIndexNames = publishedSchema.spec.indexes
      .filter((it) => it.type === 'unique')
      .map((it) => it.name);
    if (uniqueIndexNames.length > 0) {
      const uniqueIndexEnumValues: GraphQLEnumValueConfigMap = {};
      for (const indexName of uniqueIndexNames) {
        uniqueIndexEnumValues[indexName] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'PublishedUniqueIndex',
          values: uniqueIndexEnumValues,
        })
      );
    }

    // PublishedEntityEdge
    this.addType(
      new GraphQLObjectType({
        name: 'PublishedEntityEdge',
        fields: {
          node: { type: this.getOutputType('PublishedEntity') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // PublishedEntityConnection
    this.addType(
      new GraphQLObjectType({
        name: 'PublishedEntityConnection',
        fields: {
          pageInfo: { type: new GraphQLNonNull(this.getOutputType('PageInfo')) },
          edges: { type: new GraphQLList(this.getOutputType('PublishedEntityEdge')) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      })
    );

    // PublishedEntitySamplingPayload
    this.addType(
      new GraphQLObjectType({
        name: 'PublishedEntitySamplingPayload',
        fields: {
          seed: { type: new GraphQLNonNull(GraphQLInt) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
          items: { type: new GraphQLList(this.getOutputType('PublishedEntity')) },
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

    // PublishedQueryInput
    const sharedQueryInputFields = {
      authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      entityTypes: {
        type: new GraphQLList(new GraphQLNonNull(this.getEnumType('EntityType'))),
      },
      linksTo: { type: this.getInputType('EntityReferenceInput') },
      linksFrom: { type: this.getInputType('EntityReferenceInput') },
      boundingBox: { type: this.getInputType('BoundingBoxInput') },
      text: { type: GraphQLString },
    };

    this.addType(
      new GraphQLInputObjectType({
        name: 'PublishedQueryInput',
        fields: sharedQueryInputFields,
      })
    );

    // PublishedSearchQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'PublishedSearchQueryInput',
        fields: {
          ...sharedQueryInputFields,
          order: { type: this.getEnumType('QueryOrder') },
          reverse: { type: GraphQLBoolean },
        },
      })
    );
  }

  addEntityTypes(publishedSchema: PublishedSchema): void {
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      this.addEntityType(entitySpec);
    }
  }

  addEntityType(entitySpec: PublishedEntityTypeSpecification): void {
    // PublishedFooFields
    const fieldsTypeName = `Published${entitySpec.name}Fields`;
    if (entitySpec.fields.length > 0) {
      this.addType(
        new GraphQLObjectType<PublishedEntity, TContext>({
          name: fieldsTypeName,
          fields: () => {
            const fields: GraphQLFieldConfigMap<PublishedEntity, TContext> = {};
            this.addTypeSpecificationOutputFields(entitySpec, fields, false);
            return fields;
          },
        })
      );
    }

    // PublishedFoo
    this.addType(
      new GraphQLObjectType<PublishedEntity, TContext>({
        name: toPublishedTypeName(entitySpec.name),
        interfaces: this.getInterfaces('Node', 'PublishedEntity'),
        isTypeOf: (source, _context, _info) => source.info.type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<PublishedEntity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: new GraphQLNonNull(this.getOutputType('PublishedEntityInfo')) },
          };
          if (entitySpec.fields.length > 0) {
            fields.fields = { type: new GraphQLNonNull(this.getOutputType(fieldsTypeName)) };
          }
          return fields;
        },
      })
    );
  }

  addPublishedValueTypes(publishedSchema: PublishedSchema): void {
    for (const valueSpec of publishedSchema.spec.valueTypes) {
      this.addPublishedValueType(valueSpec);
    }
  }

  addPublishedValueType(valueSpec: PublishedValueTypeSpecification): void {
    // PublishedFoo
    this.addType(
      new GraphQLObjectType<ValueItem, TContext>({
        name: toPublishedTypeName(valueSpec.name),
        interfaces: this.getInterfaces(toPublishedTypeName('Value')),
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
          createdAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
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
          createdAndPublished: {},
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
          updatedAndPublished: {},
          published: {},
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
          createdAndPublished: {},
          updated: {},
          updatedAndPublished: {},
          published: {},
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

    // AdminEntitySamplingPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntitySamplingPayload',
        fields: {
          seed: { type: new GraphQLNonNull(GraphQLInt) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
          items: { type: new GraphQLList(this.getOutputType('AdminEntity')) },
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
    const sharedQueryInputFields = {
      authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      entityTypes: {
        type: new GraphQLList(new GraphQLNonNull(this.getEnumType('AdminEntityType'))),
      },
      linksTo: { type: this.getInputType('EntityReferenceInput') },
      linksFrom: { type: this.getInputType('EntityReferenceInput') },
      boundingBox: { type: this.getInputType('BoundingBoxInput') },
      text: { type: GraphQLString },
    };

    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminQueryInput',
        fields: sharedQueryInputFields,
      })
    );

    // AdminSearchQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminSearchQueryInput',
        fields: {
          ...sharedQueryInputFields,
          order: { type: this.getEnumType('AdminQueryOrder') },
          reverse: { type: GraphQLBoolean },
        },
      })
    );

    // EntityVersionReferenceInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityVersionReferenceInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
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
          root: { type: new GraphQLNonNull(GraphQLJSON) },
          entities: { type: new GraphQLList(this.getInterface('AdminEntity')) },
        },
      })
    );

    // AdminRichTextInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminRichTextInput',
        fields: {
          root: { type: new GraphQLNonNull(GraphQLJSON) },
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
          createdAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
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
          publishedAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
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
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
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
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
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
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
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
          updatedAt: { type: new GraphQLNonNull(this.getOutputType('DateTime')) },
        },
      })
    );

    // AdvisoryLockPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdvisoryLockPayload',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
          handle: { type: new GraphQLNonNull(GraphQLInt) },
        },
      })
    );

    // AdvisoryLockReleasePayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdvisoryLockReleasePayload',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
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
    // AdminFoo
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
    typeSpec:
      | PublishedEntityTypeSpecification
      | PublishedValueTypeSpecification
      | AdminEntityTypeSpecification
      | AdminValueTypeSpecification,
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
          fieldType = this.getInputType('EntityReferenceInput');
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

  buildQueryFieldNode<TSource>(
    publishedSchema: PublishedSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getInterface('Node'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadPublishedEntity(publishedSchema, context, args);
      },
    });
  }

  buildQueryFieldNodes<TSource>(
    publishedSchema: PublishedSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('Node')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadPublishedEntities(publishedSchema, context, args.ids);
      },
    });
  }

  buildQueryFieldPublishedEntity<TSource>(
    publishedSchema: PublishedSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    if (publishedSchema.spec.indexes.length === 0) {
      return fieldConfigWithArgs<TSource, TContext, { id: string }>({
        type: this.getInterface('PublishedEntity'),
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: async (_source, args, context, _info) => {
          return await loadPublishedEntity(publishedSchema, context, args);
        },
      });
    }

    return fieldConfigWithArgs<
      TSource,
      TContext,
      { id: string | null; index: string | null; value: string | null }
    >({
      type: this.getInterface('PublishedEntity'),
      args: {
        id: { type: GraphQLID },
        index: { type: this.getInputType('PublishedUniqueIndex') },
        value: { type: GraphQLString },
      },
      resolve: async (_source, args, context, _info) => {
        let reference;
        if (args.id) {
          reference = { id: args.id };
        } else if (args.index && args.value) {
          reference = { index: args.index, value: args.value };
        } else {
          throw new Error('Either id or index and value must be specified');
        }
        return await loadPublishedEntity(publishedSchema, context, reference);
      },
    });
  }

  buildQueryFieldAdminEntity<TSource>(
    adminSchema: AdminSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; version: number | null }>({
      type: this.getInterface('AdminEntity'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        version: { type: GraphQLInt },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadAdminEntity(adminSchema, context, args.id, args.version);
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

  buildQueryFieldAdminSampleEntities<TSource>(
    adminSchema: AdminSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: AdminQuery;
        seed?: number;
        count?: number;
      }
    >({
      type: this.getOutputType('AdminEntitySamplingPayload'),
      args: {
        query: { type: this.getInputType('AdminQueryInput') },
        seed: { type: GraphQLInt },
        count: { type: GraphQLInt },
      },
      resolve: async (_source, args, context, _info) => {
        const { query, seed, count } = args;
        const options = { seed, count };
        return await loadAdminSampleEntities(adminSchema, context, query, options);
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
        query?: AdminSearchQuery;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('AdminEntityConnection'),
      args: {
        query: { type: this.getInputType('AdminSearchQueryInput') },
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

  buildQueryFieldPublishedSampleEntities<TSource>(
    publishedSchema: PublishedSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: PublishedQuery;
        seed?: number;
        count?: number;
      }
    >({
      type: this.getOutputType('PublishedEntitySamplingPayload'),
      args: {
        query: { type: this.getInputType('PublishedQueryInput') },
        seed: { type: GraphQLInt },
        count: { type: GraphQLInt },
      },
      resolve: async (_source, args, context, _info) => {
        const { query, count, seed } = args;
        const options = { count, seed };
        return await loadPublishedSampleEntities(publishedSchema, context, query, options);
      },
    });
  }

  buildQueryFieldSearchEntities<TSource>(
    publishedSchema: PublishedSchema
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: PublishedSearchQuery;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('PublishedEntityConnection'),
      args: {
        query: { type: this.getInputType('PublishedSearchQueryInput') },
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
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('EntityHistory'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await loadVersionHistory(context, { id });
      },
    });
  }

  buildQueryFieldPublishingHistory<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('PublishingHistory'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await loadPublishingHistory(context, { id });
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
              publishedEntity: this.buildQueryFieldPublishedEntity(this.publishedSchema),
              publishedSampleEntities: this.buildQueryFieldPublishedSampleEntities(
                this.publishedSchema
              ),
              searchEntities: this.buildQueryFieldSearchEntities(this.publishedSchema),
            }
          : {}),
        ...(this.adminSchema && this.adminSchema.getEntityTypeCount() > 0
          ? {
              adminEntity: this.buildQueryFieldAdminEntity(this.adminSchema),
              adminEntities: this.buildQueryFieldAdminEntities(this.adminSchema),
              adminSampleEntities: this.buildQueryFieldAdminSampleEntities(this.adminSchema),
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
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { entity: AdminEntityCreate; publish: boolean | null }
    >({
      type: this.getOutputType(toAdminCreatePayloadTypeName(entityName)),
      args: {
        entity: {
          type: new GraphQLNonNull(this.getInputType(toAdminCreateInputTypeName(entityName))),
        },
        publish: { type: GraphQLBoolean },
      },
      resolve: async (_source, args, context, _info) => {
        const { entity, publish } = args;
        if (entity.info.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        entity.info.type = entityName;
        this.resolveJsonInputFields(adminSchema, entity, entityName);
        return await Mutations.createEntity(adminSchema, context, entity, {
          publish: publish ?? undefined,
        });
      },
    });
  }

  buildMutationUpdateEntity<TSource>(
    adminSchema: AdminSchema,
    entityName: string
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { entity: AdminEntityUpdate; publish: boolean | null }
    >({
      type: this.getOutputType(toAdminUpdatePayloadTypeName(entityName)),
      args: {
        entity: {
          type: new GraphQLNonNull(this.getInputType(toAdminUpdateInputTypeName(entityName))),
        },
        publish: { type: GraphQLBoolean },
      },
      resolve: async (_source, args, context, _info) => {
        const { entity, publish } = args;
        if (entity.info?.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        this.resolveJsonInputFields(adminSchema, entity, entityName);
        return await Mutations.updateEntity(adminSchema, context, entity, {
          publish: publish ?? undefined,
        });
      },
    });
  }

  buildMutationUpsertEntity<TSource>(
    adminSchema: AdminSchema,
    entityName: string
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { entity: AdminEntityUpsert; publish: boolean | null }
    >({
      type: this.getOutputType(toAdminUpsertPayloadTypeName(entityName)),
      args: {
        entity: {
          type: new GraphQLNonNull(this.getInputType(toAdminUpsertInputTypeName(entityName))),
        },
        publish: { type: GraphQLBoolean },
      },
      resolve: async (_source, args, context, _info) => {
        const { entity, publish } = args;
        if (entity.info?.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        this.resolveJsonInputFields(adminSchema, entity, entityName);
        return await Mutations.upsertEntity(adminSchema, context, entity, {
          publish: publish ?? undefined,
        });
      },
    });
  }

  buildMutationAcquireAdvisoryLock<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { name: string; leaseDuration: number }>({
      type: this.getOutputType('AdvisoryLockPayload'),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        leaseDuration: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_source, args, context, _info) => {
        const { name, leaseDuration } = args;
        const options: AdvisoryLockOptions = { leaseDuration };
        return await Mutations.acquireAdvisoryLock(context, name, options);
      },
    });
  }

  buildMutationRenewAdvisoryLock<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { name: string; handle: number }>({
      type: this.getOutputType('AdvisoryLockPayload'),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        handle: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_source, args, context, _info) => {
        const { name, handle } = args;
        return await Mutations.renewAdvisoryLock(context, name, handle);
      },
    });
  }

  buildMutationReleaseAdvisoryLock<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { name: string; handle: number }>({
      type: this.getOutputType('AdvisoryLockReleasePayload'),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        handle: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_source, args, context, _info) => {
        const { name, handle } = args;
        return await Mutations.releaseAdvisoryLock(context, name, handle);
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
          ? adminSchema.getEntityFieldSpecification(
              typeSpec as AdminEntityTypeSpecification,
              fieldName
            )
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
    return fieldConfigWithArgs<TSource, TContext, { references: EntityVersionReference[] }>({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('AdminEntityPublishPayload'))),
      args: {
        references: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(this.getInputType('EntityVersionReferenceInput')))
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
    return fieldConfigWithArgs<TSource, TContext, { references: EntityReference[] }>({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('AdminEntityUnpublishPayload'))),
      args: {
        references: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(this.getInputType('EntityReferenceInput')))
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
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('AdminEntityArchivePayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await Mutations.archiveEntity(context, { id });
      },
    });
  }

  buildMutationUnarchiveEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('AdminEntityUnarchivePayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await Mutations.unarchiveEntity(context, { id });
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

    fields.acquireAdvisoryLock = this.buildMutationAcquireAdvisoryLock();
    fields.renewAdvisoryLock = this.buildMutationRenewAdvisoryLock();
    fields.releaseAdvisoryLock = this.buildMutationReleaseAdvisoryLock();

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
      this.addPublishedValueTypes(this.publishedSchema);
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

    return { query: queryType, mutation: mutationType, types: this.getTypes() };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
