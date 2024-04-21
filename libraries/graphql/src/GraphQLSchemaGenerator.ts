import {
  EventType,
  FieldType,
  isComponent,
  isComponentItemField,
  notOk,
  type AdminClient,
  type ComponentTypeSpecification,
  type AdminEntity,
  type AdminEntityCreate,
  type EntityQuery,
  type AdminEntitySharedQuery,
  type EntityTypeSpecification,
  type AdminEntityUpdate,
  type AdminEntityUpsert,
  type Schema,
  type AdvisoryLockOptions,
  type ChangelogEvent,
  type ChangelogEventQuery,
  type Component,
  type EntityReference,
  type EntityVersionReference,
  type ErrorType,
  type PublishedClient,
  type PublishedComponentTypeSpecification,
  type PublishedEntity,
  type PublishedEntityQuery,
  type PublishedEntitySharedQuery,
  type PublishedEntityTypeSpecification,
  type PublishedSchema,
  type Result,
} from '@dossierhq/core';
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
  GraphQLSchema,
  GraphQLString,
  type GraphQLEnumValueConfigMap,
  type GraphQLFieldConfig,
  type GraphQLFieldConfigMap,
  type GraphQLInputFieldConfigMap,
  type GraphQLSchemaConfig,
} from 'graphql';
import {
  loadAdminEntities,
  loadAdminEntitiesSample,
  loadAdminEntity,
  loadAdminEntityList,
  loadChangelogEvents,
  loadPublishedEntities,
  loadPublishedEntitiesSample,
  loadPublishedEntity,
  loadPublishedEntityList,
} from './DataLoaders.js';
import * as Mutations from './Mutations.js';
import {
  toAdminComponentInputTypeName,
  toAdminCreateInputTypeName,
  toAdminCreatePayloadTypeName,
  toAdminTypeName,
  toAdminUpdateInputTypeName,
  toAdminUpdatePayloadTypeName,
  toAdminUpsertInputTypeName,
  toAdminUpsertPayloadTypeName,
  toPublishedTypeName,
} from './NameGenerator.js';
import { TypeRepository } from './TypeRepository.js';
import { DateTimeScalar } from './scalars/DateTimeScalar.js';
import { LocationScalar } from './scalars/LocationScalar.js';
import { assertExhaustive } from './utils/AssertUtils.js';
import { GraphQLJSONObject } from './vendor/GraphQLJsonScalar.js';

export interface SessionGraphQLContext {
  adminClient: Result<
    AdminClient<AdminEntity> | AdminClient<AdminEntity<string, object>, Component<string, object>>,
    typeof ErrorType.NotAuthenticated
  >;
  publishedClient: Result<
    | PublishedClient<PublishedEntity>
    | PublishedClient<PublishedEntity<string, object>, Component<string, object>>,
    typeof ErrorType.NotAuthenticated
  >;
}

function fieldConfigWithArgs<TSource, TContext, TArgs>(
  config: GraphQLFieldConfig<TSource, TContext, TArgs>,
): GraphQLFieldConfig<TSource, TContext> {
  return config as GraphQLFieldConfig<TSource, TContext>;
}

export class GraphQLSchemaGenerator<TContext extends SessionGraphQLContext> extends TypeRepository {
  private readonly adminSchema: Schema | null;
  private readonly publishedSchema: PublishedSchema | null;

  constructor({
    adminSchema,
    publishedSchema,
  }: {
    adminSchema: Schema | null;
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
      }),
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
      }),
    );

    const containsEntityTypes =
      !!(this.adminSchema && this.adminSchema.getEntityTypeCount() > 0) ||
      !!(this.publishedSchema && this.publishedSchema.getEntityTypeCount() > 0);
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
      }),
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
      }),
    );
  }

  addPublishedSupportingTypes(publishedSchema: PublishedSchema): void {
    if (publishedSchema.getEntityTypeCount() === 0) {
      return;
    }

    // PublishedEntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      entityTypeEnumValues[entitySpec.name] = {};
    }
    this.addType(
      new GraphQLEnumType({
        name: 'PublishedEntityType',
        values: entityTypeEnumValues,
      }),
    );

    if (publishedSchema.getComponentTypeCount() > 0) {
      // PublishedComponentType
      const componentTypeEnumValues: GraphQLEnumValueConfigMap = {};
      for (const componentSpec of publishedSchema.spec.componentTypes) {
        componentTypeEnumValues[componentSpec.name] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'PublishedComponentType',
          values: componentTypeEnumValues,
        }),
      );
    }

    // PublishedEntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'PublishedEntityInfo',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
          authKey: { type: new GraphQLNonNull(GraphQLString) },
          createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
          valid: { type: new GraphQLNonNull(GraphQLBoolean) },
        },
      }),
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
      }),
    );

    if (publishedSchema.getComponentTypeCount() > 0) {
      // PublishedValue
      this.addType(
        new GraphQLInterfaceType({
          name: toPublishedTypeName('Value'),
          fields: {
            type: { type: new GraphQLNonNull(this.getEnumType('PublishedComponentType')) },
          },
        }),
      );
    }

    // PublishedRichText
    this.addType(
      new GraphQLObjectType({
        name: 'PublishedRichText',
        fields: {
          root: { type: new GraphQLNonNull(GraphQLJSONObject) },
          entities: { type: new GraphQLList(this.getInterface('PublishedEntity')) },
        },
      }),
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
        }),
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
      }),
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
      }),
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
      }),
    );

    // PublishedEntityQueryOrder
    this.addType(
      new GraphQLEnumType({
        name: 'PublishedEntityQueryOrder',
        values: { createdAt: {}, name: {} },
      }),
    );

    // PublishedQueryInput
    const sharedQueryInputFields = {
      authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      entityTypes: {
        type: new GraphQLList(new GraphQLNonNull(this.getEnumType('PublishedEntityType'))),
      },
      ...(publishedSchema.getComponentTypeCount() > 0
        ? {
            componentTypes: {
              type: new GraphQLList(new GraphQLNonNull(this.getEnumType('PublishedComponentType'))),
            },
          }
        : {}),
      linksTo: { type: this.getInputType('EntityReferenceInput') },
      linksFrom: { type: this.getInputType('EntityReferenceInput') },
      boundingBox: { type: this.getInputType('BoundingBoxInput') },
      text: { type: GraphQLString },
    };

    this.addType(
      new GraphQLInputObjectType({
        name: 'PublishedQueryInput',
        fields: sharedQueryInputFields,
      }),
    );

    // PublishedEntitiesQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'PublishedEntitiesQueryInput',
        fields: {
          ...sharedQueryInputFields,
          order: { type: this.getEnumType('PublishedEntityQueryOrder') },
          reverse: { type: GraphQLBoolean },
        },
      }),
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
        }),
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
      }),
    );
  }

  addPublishedComponentTypes(publishedSchema: PublishedSchema): void {
    for (const componentSpec of publishedSchema.spec.componentTypes) {
      this.addPublishedComponentType(componentSpec);
    }
  }

  addPublishedComponentType(componentSpec: PublishedComponentTypeSpecification): void {
    // PublishedFoo
    this.addType(
      new GraphQLObjectType<Component, TContext>({
        name: toPublishedTypeName(componentSpec.name),
        interfaces: this.getInterfaces(toPublishedTypeName('Value')),
        isTypeOf: (source, _context, _info) => source.type === componentSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Component, TContext> = {
            type: { type: new GraphQLNonNull(this.getEnumType('PublishedComponentType')) },
          };
          this.addTypeSpecificationOutputFields(componentSpec, fields, false);
          return fields;
        },
      }),
    );
  }

  addAdminSupportingTypes(adminSchema: Schema): void {
    if (adminSchema.getEntityTypeCount() === 0) {
      return;
    }

    this.addChangelogSupportingTypes();

    // AdminEntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const entitySpec of adminSchema.spec.entityTypes) {
      entityTypeEnumValues[entitySpec.name] = {};
    }
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityType',
        values: entityTypeEnumValues,
      }),
    );

    if (adminSchema.getComponentTypeCount() > 0) {
      // AdminComponentType
      const componentTypeEnumValues: GraphQLEnumValueConfigMap = {};
      for (const componentSpec of adminSchema.spec.componentTypes) {
        componentTypeEnumValues[componentSpec.name] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'AdminComponentType',
          values: componentTypeEnumValues,
        }),
      );
    }

    // EntityStatus
    this.addType(
      new GraphQLEnumType({
        name: 'EntityStatus',
        values: {
          draft: {},
          published: {},
          modified: {},
          withdrawn: {},
          archived: {},
        },
      }),
    );

    // EntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'EntityInfo',
        fields: {
          type: { type: new GraphQLNonNull(this.getOutputType('AdminEntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
          authKey: { type: new GraphQLNonNull(GraphQLString) },
          status: { type: new GraphQLNonNull(this.getOutputType('EntityStatus')) },
          valid: { type: new GraphQLNonNull(GraphQLBoolean) },
          validPublished: { type: GraphQLBoolean },
          createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // AdminEntityCreateInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntityCreateInfo',
        fields: {
          type: { type: this.getEnumType('AdminEntityType') },
          name: { type: new GraphQLNonNull(GraphQLString) },
          version: { type: GraphQLInt },
          authKey: { type: GraphQLString },
        },
      }),
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
      }),
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
      }),
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
      }),
    );

    // AdminEntityUpsertInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntityUpsertInfo',
        fields: {
          type: { type: new GraphQLNonNull(this.getEnumType('AdminEntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          authKey: { type: GraphQLString },
        },
      }),
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
      }),
    );

    // AdminEntity
    this.addType(
      new GraphQLInterfaceType({
        name: 'AdminEntity',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          info: { type: new GraphQLNonNull(this.getOutputType('EntityInfo')) },
          changelogEvents: {
            type: this.getOutputType('EntityChangelogEventConnection'),
            args: {
              query: { type: this.getInputType('ChangelogEventQueryInput') },
              first: { type: GraphQLInt },
              after: { type: GraphQLString },
              last: { type: GraphQLInt },
              before: { type: GraphQLString },
            },
          },
        },
      }),
    );

    // AdminUniqueIndex
    const uniqueIndexNames = adminSchema.spec.indexes
      .filter((it) => it.type === 'unique')
      .map((it) => it.name);
    if (uniqueIndexNames.length > 0) {
      const uniqueIndexEnumValues: GraphQLEnumValueConfigMap = {};
      for (const indexName of uniqueIndexNames) {
        uniqueIndexEnumValues[indexName] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'AdminUniqueIndex',
          values: uniqueIndexEnumValues,
        }),
      );
    }

    // AdminEntityEdge
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityEdge',
        fields: {
          node: { type: this.getOutputType('AdminEntity') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      }),
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
      }),
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
      }),
    );

    // EntityQueryOrder
    this.addType(
      new GraphQLEnumType({
        name: 'EntityQueryOrder',
        values: { createdAt: {}, updatedAt: {}, name: {} },
      }),
    );

    // AdminEntitiesSharedQueryInput
    const sharedQueryInputFields = {
      authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      entityTypes: {
        type: new GraphQLList(new GraphQLNonNull(this.getEnumType('AdminEntityType'))),
      },
      ...(adminSchema.getComponentTypeCount() > 0
        ? {
            componentTypes: {
              type: new GraphQLList(new GraphQLNonNull(this.getEnumType('AdminComponentType'))),
            },
          }
        : {}),
      status: { type: new GraphQLList(new GraphQLNonNull(this.getEnumType('EntityStatus'))) },
      valid: { type: GraphQLBoolean },
      linksTo: { type: this.getInputType('EntityReferenceInput') },
      linksFrom: { type: this.getInputType('EntityReferenceInput') },
      boundingBox: { type: this.getInputType('BoundingBoxInput') },
      text: { type: GraphQLString },
    };

    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntitiesSharedQueryInput',
        fields: sharedQueryInputFields,
      }),
    );

    // AdminEntitiesQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntitiesQueryInput',
        fields: {
          ...sharedQueryInputFields,
          order: { type: this.getEnumType('EntityQueryOrder') },
          reverse: { type: GraphQLBoolean },
        },
      }),
    );

    // EntityVersionReferenceInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityVersionReferenceInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
        },
      }),
    );

    if (this.adminSchema && this.adminSchema.getComponentTypeCount() > 0) {
      // AdminValue
      this.addType(
        new GraphQLInterfaceType({
          name: 'AdminValue',
          fields: {
            type: { type: new GraphQLNonNull(this.getEnumType('AdminComponentType')) },
          },
        }),
      );
    }

    // AdminRichText
    this.addType(
      new GraphQLObjectType({
        name: 'AdminRichText',
        fields: {
          root: { type: new GraphQLNonNull(GraphQLJSONObject) },
          entities: { type: new GraphQLList(this.getInterface('AdminEntity')) },
        },
      }),
    );

    // AdminRichTextInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminRichTextInput',
        fields: {
          root: { type: new GraphQLNonNull(GraphQLJSONObject) },
        },
      }),
    );

    // EntityVersionInfo
    this.addType(
      new GraphQLObjectType({
        name: 'EntityVersionInfo',
        fields: {
          version: { type: new GraphQLNonNull(GraphQLInt) },
          published: { type: new GraphQLNonNull(GraphQLBoolean) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // AdminEntityPublishEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityPublishEffect',
        values: {
          published: {},
          none: {},
        },
      }),
    );

    // AdminEntityPublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityPublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityPublishEffect')) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // AdminEntityUnpublishEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityUnpublishEffect',
        values: {
          unpublished: {},
          none: {},
        },
      }),
    );

    // AdminEntityUnpublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityUnpublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityUnpublishEffect')) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // AdminEntityArchiveEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityArchiveEffect',
        values: {
          archived: {},
          none: {},
        },
      }),
    );

    // AdminEntityArchivePayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityArchivePayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityArchiveEffect')) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // AdminEntityUnarchiveEffect
    this.addType(
      new GraphQLEnumType({
        name: 'AdminEntityUnarchiveEffect',
        values: {
          unarchived: {},
          none: {},
        },
      }),
    );

    // AdminEntityUnarchivePayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityUnarchivePayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('AdminEntityUnarchiveEffect')) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // AdvisoryLockPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdvisoryLockPayload',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
          handle: { type: new GraphQLNonNull(GraphQLInt) },
        },
      }),
    );

    // AdvisoryLockReleasePayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdvisoryLockReleasePayload',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
        },
      }),
    );
  }

  addChangelogSupportingTypes(): void {
    // EventType
    this.addType(
      new GraphQLEnumType({
        name: 'EventType',
        values: {
          createEntity: {},
          createAndPublishEntity: {},
          updateEntity: {},
          updateAndPublishEntity: {},
          publishEntities: {},
          unpublishEntities: {},
          archiveEntity: {},
          unarchiveEntity: {},
          updateSchema: {},
        },
      }),
    );

    // ChangelogEventQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'ChangelogEventQueryInput',
        fields: {
          reverse: { type: GraphQLBoolean },
          createdBy: { type: GraphQLID },
          types: { type: new GraphQLList(new GraphQLNonNull(this.getEnumType('EventType'))) },
        },
      }),
    );

    // ChangelogEvent
    this.addType(
      new GraphQLInterfaceType({
        name: 'ChangelogEvent',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          type: { type: new GraphQLNonNull(this.getEnumType('EventType')) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // SchemaChangelogEvent
    this.addType(
      new GraphQLObjectType<ChangelogEvent, TContext>({
        name: 'SchemaChangelogEvent',
        interfaces: this.getInterfaces('ChangelogEvent'),
        isTypeOf: (source, _context, _info) => source.type === EventType.updateSchema,
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          type: { type: new GraphQLNonNull(this.getEnumType('EventType')) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
        },
      }),
    );

    // EntityChangelogEventEntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'EntityChangelogEventEntityInfo',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
          type: { type: new GraphQLNonNull(GraphQLString) },
          name: { type: new GraphQLNonNull(GraphQLString) },
        },
      }),
    );

    // EntityChangelogEvent
    this.addType(
      new GraphQLObjectType<ChangelogEvent, TContext>({
        name: 'EntityChangelogEvent',
        interfaces: this.getInterfaces('ChangelogEvent'),
        isTypeOf: (source, _context, _info) => source.type !== EventType.updateSchema,
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          type: { type: new GraphQLNonNull(this.getEnumType('EventType')) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
          entities: {
            type: new GraphQLNonNull(
              new GraphQLList(
                new GraphQLNonNull(this.getOutputType('EntityChangelogEventEntityInfo')),
              ),
            ),
          },
          unauthorizedEntityCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      }),
    );

    // ChangelogEventEdge
    this.addType(
      new GraphQLObjectType({
        name: 'ChangelogEventEdge',
        fields: {
          node: { type: this.getOutputType('ChangelogEvent') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      }),
    );

    // ChangelogEventConnection
    this.addType(
      new GraphQLObjectType({
        name: 'ChangelogEventConnection',
        fields: {
          pageInfo: { type: new GraphQLNonNull(this.getOutputType('PageInfo')) },
          edges: { type: new GraphQLList(this.getOutputType('ChangelogEventEdge')) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      }),
    );

    // EntityChangelogEventEdge
    this.addType(
      new GraphQLObjectType({
        name: 'EntityChangelogEventEdge',
        fields: {
          node: { type: this.getOutputType('EntityChangelogEvent') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      }),
    );

    // EntityChangelogEventConnection
    this.addType(
      new GraphQLObjectType({
        name: 'EntityChangelogEventConnection',
        fields: {
          pageInfo: { type: new GraphQLNonNull(this.getOutputType('PageInfo')) },
          edges: { type: new GraphQLList(this.getOutputType('EntityChangelogEventEdge')) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      }),
    );
  }

  addAdminEntityTypes(adminSchema: Schema): void {
    for (const entitySpec of adminSchema.spec.entityTypes) {
      this.addAdminEntityType(entitySpec);
    }
  }

  addAdminEntityType(entitySpec: EntityTypeSpecification): void {
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
        }),
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
            info: { type: new GraphQLNonNull(this.getOutputType('EntityInfo')) },
            changelogEvents: {
              type: this.getOutputType('EntityChangelogEventConnection'),
              args: {
                query: { type: this.getInputType('ChangelogEventQueryInput') },
                first: { type: GraphQLInt },
                after: { type: GraphQLString },
                last: { type: GraphQLInt },
                before: { type: GraphQLString },
              },
            },
          };
          if (fieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getOutputType(fieldsName)) };
          }
          return fields;
        },
      }),
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
        }),
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
      }),
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
      }),
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
      }),
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
      }),
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
      }),
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
      }),
    );
  }

  addAdminComponentTypes(adminSchema: Schema): void {
    for (const componentSpec of adminSchema.spec.componentTypes) {
      this.addAdminComponentType(componentSpec);
    }
  }

  addAdminComponentType(componentSpec: ComponentTypeSpecification): void {
    // AdminFoo
    this.addType(
      new GraphQLObjectType<Component, TContext>({
        name: toAdminTypeName(componentSpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Value')),
        isTypeOf: (source, _context, _info) => source.type === componentSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Component, TContext> = {
            type: { type: new GraphQLNonNull(this.getEnumType('AdminComponentType')) },
          };
          this.addTypeSpecificationOutputFields(componentSpec, fields, true);
          return fields;
        },
      }),
    );

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminComponentInputTypeName(componentSpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            type: { type: new GraphQLNonNull(this.getEnumType('AdminComponentType')) },
          };
          this.addTypeSpecificationInputFields(componentSpec, fields);
          return fields;
        },
      }),
    );
  }

  addTypeSpecificationOutputFields<TSource>(
    typeSpec:
      | PublishedEntityTypeSpecification
      | PublishedComponentTypeSpecification
      | EntityTypeSpecification
      | ComponentTypeSpecification,
    fields: GraphQLFieldConfigMap<TSource, TContext>,
    isAdmin: boolean,
  ): void {
    for (const fieldSpec of typeSpec.fields) {
      let fieldType;
      switch (fieldSpec.type) {
        case FieldType.Boolean:
          fieldType = GraphQLBoolean;
          break;
        case FieldType.Component:
          fieldType = this.getOrCreateValueUnion(isAdmin, fieldSpec.componentTypes ?? []);
          break;
        case FieldType.Reference:
          fieldType = this.getOrCreateEntityUnion(isAdmin, fieldSpec.entityTypes ?? []);
          break;
        case FieldType.Location:
          fieldType = LocationScalar;
          break;
        case FieldType.Number:
          fieldType = fieldSpec.integer ? GraphQLInt : GraphQLFloat;
          break;
        case FieldType.RichText:
          fieldType = this.getOutputType(toAdminTypeName('RichText', isAdmin));
          break;
        case FieldType.String:
          fieldType = GraphQLString;
          break;
        default:
          assertExhaustive(fieldSpec);
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
    typeSpec: EntityTypeSpecification | ComponentTypeSpecification,
    fields: GraphQLInputFieldConfigMap,
  ): void {
    for (const fieldSpec of typeSpec.fields) {
      let fieldType;
      switch (fieldSpec.type) {
        case FieldType.Boolean:
          fieldType = GraphQLBoolean;
          break;
        case FieldType.Reference:
          fieldType = this.getInputType('EntityReferenceInput');
          break;
        case FieldType.Location:
          fieldType = LocationScalar;
          break;
        case FieldType.Number:
          fieldType = fieldSpec.integer ? GraphQLInt : GraphQLFloat;
          break;
        case FieldType.RichText:
          fieldType = this.getInputType('AdminRichTextInput');
          break;
        case FieldType.String:
          fieldType = GraphQLString;
          break;
        case FieldType.Component: {
          //TODO use GraphQLJSON. Is it still needed or is normal fieldType enough?
          fields[`${fieldSpec.name}Json`] = { type: GraphQLString };

          fieldType = this.getValueInputType(fieldSpec.componentTypes ?? []);
          break;
        }
        default:
          assertExhaustive(fieldSpec);
      }

      if (fieldType) {
        fields[fieldSpec.name] = {
          type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
        };
      }
    }
  }

  buildQueryFieldNode<TSource>(
    publishedSchema: PublishedSchema,
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
    publishedSchema: PublishedSchema,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('Node')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadPublishedEntityList(publishedSchema, context, args.ids);
      },
    });
  }

  buildQueryFieldPublishedEntity<TSource>(
    publishedSchema: PublishedSchema,
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

  buildQueryFieldAdminEntity<TSource>(adminSchema: Schema): GraphQLFieldConfig<TSource, TContext> {
    if (adminSchema.spec.indexes.length === 0) {
      return fieldConfigWithArgs<TSource, TContext, { id: string; version?: number | null }>({
        type: this.getInterface('AdminEntity'),
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          version: { type: GraphQLInt },
        },
        resolve: async (_source, args, context, _info) => {
          let reference;
          if (typeof args.version === 'number') {
            reference = { id: args.id, version: args.version };
          } else {
            reference = { id: args.id };
          }

          return await loadAdminEntity(adminSchema, context, reference);
        },
      });
    }
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { id?: string | null; version?: number | null; index?: string | null; value?: string | null }
    >({
      type: this.getInterface('AdminEntity'),
      args: {
        id: { type: GraphQLID },
        version: { type: GraphQLInt },
        index: { type: this.getInputType('AdminUniqueIndex') },
        value: { type: GraphQLString },
      },
      resolve: async (_source, args, context, _info) => {
        let reference;
        if (args.id && typeof args.version === 'number') {
          reference = { id: args.id, version: args.version };
        } else if (args.id) {
          reference = { id: args.id };
        } else if (args.index && args.value) {
          reference = { index: args.index, value: args.value };
        } else {
          throw new Error('Either (id), (id and version) or (index and value) must be specified');
        }

        return await loadAdminEntity(adminSchema, context, reference);
      },
    });
  }

  buildQueryFieldAdminEntityList<TSource>(
    adminSchema: Schema,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('AdminEntity')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadAdminEntityList(adminSchema, context, args.ids);
      },
    });
  }

  buildQueryFieldAdminEntitiesSample<TSource>(
    adminSchema: Schema,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: AdminEntitySharedQuery;
        seed?: number;
        count?: number;
      }
    >({
      type: this.getOutputType('AdminEntitySamplingPayload'),
      args: {
        query: { type: this.getInputType('AdminEntitiesSharedQueryInput') },
        seed: { type: GraphQLInt },
        count: { type: GraphQLInt },
      },
      resolve: async (_source, args, context, _info) => {
        const { query, seed, count } = args;
        const options = { seed, count };
        return await loadAdminEntitiesSample(adminSchema, context, query, options);
      },
    });
  }

  buildQueryFieldAdminEntities<TSource>(
    adminSchema: Schema,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: EntityQuery;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('AdminEntityConnection'),
      args: {
        query: { type: this.getInputType('AdminEntitiesQueryInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (_source, args, context, info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadAdminEntities(adminSchema, context, query, paging, info);
      },
    });
  }

  buildQueryFieldPublishedSampleEntities<TSource>(
    publishedSchema: PublishedSchema,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: PublishedEntitySharedQuery;
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
        return await loadPublishedEntitiesSample(publishedSchema, context, query, options);
      },
    });
  }

  buildQueryFieldPublishedEntities<TSource>(
    publishedSchema: PublishedSchema,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: PublishedEntityQuery;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('PublishedEntityConnection'),
      args: {
        query: { type: this.getInputType('PublishedEntitiesQueryInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (_source, args, context, info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadPublishedEntities(publishedSchema, context, query, paging, info);
      },
    });
  }

  buildQueryFieldChangelogEvents<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: ChangelogEventQuery;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('ChangelogEventConnection'),
      args: {
        query: { type: this.getInputType('ChangelogEventQueryInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (_source, args, context, info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadChangelogEvents(context, query, paging, info);
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
              publishedEntities: this.buildQueryFieldPublishedEntities(this.publishedSchema),
              publishedEntitiesSample: this.buildQueryFieldPublishedSampleEntities(
                this.publishedSchema,
              ),
            }
          : {}),
        ...(this.adminSchema && this.adminSchema.getEntityTypeCount() > 0
          ? {
              adminEntity: this.buildQueryFieldAdminEntity(this.adminSchema),
              adminEntityList: this.buildQueryFieldAdminEntityList(this.adminSchema),
              adminEntities: this.buildQueryFieldAdminEntities(this.adminSchema),
              adminEntitiesSample: this.buildQueryFieldAdminEntitiesSample(this.adminSchema),
              changelogEvents: this.buildQueryFieldChangelogEvents(),
            }
          : {}),
      },
    });
  }

  buildMutationCreateEntity<TSource>(
    adminSchema: Schema,
    entityName: string,
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
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`,
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
    adminSchema: Schema,
    entityName: string,
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
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`,
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
    adminSchema: Schema,
    entityName: string,
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
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`,
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
    adminSchema: Schema,
    entity: AdminEntityCreate | AdminEntityUpdate,
    entityTypeName: string,
  ): void {
    const visitItem = (
      item: AdminEntityCreate | AdminEntityUpdate | Component,
      typeSpec: EntityTypeSpecification | ComponentTypeSpecification,
      prefix: string,
      isEntity: boolean,
    ) => {
      const component = isComponent(item);
      const fields = component ? item : item.fields ?? {};
      for (const fieldName of Object.keys(fields)) {
        // Skip standard fields
        if (component && fieldName === 'type') {
          continue;
        }
        const fieldPrefix = component ? `${prefix}.${fieldName}` : `${prefix}.fields.${fieldName}`;
        const fieldValue = fields[fieldName];

        // Decode JSON component fields
        if (fieldName.endsWith('Json')) {
          const fieldNameWithoutJson = fieldName.slice(0, -'Json'.length);
          const decodedValue = this.decodeJsonInputField(fieldPrefix, fieldValue);

          delete fields[fieldName];
          fields[fieldNameWithoutJson] = decodedValue;
          continue;
        }

        const fieldSpec = isEntity
          ? adminSchema.getEntityFieldSpecification(typeSpec as EntityTypeSpecification, fieldName)
          : adminSchema.getComponentFieldSpecification(typeSpec, fieldName);

        // Traverse into components
        if (fieldSpec && isComponentItemField(fieldSpec, fieldValue) && fieldValue) {
          const type = fieldValue.type;
          const componentSpec = adminSchema.getComponentTypeSpecification(type);
          if (!componentSpec) {
            throw new Error(`${fieldPrefix}: No such type ${type}`);
          }

          visitItem(fieldValue, componentSpec, fieldPrefix, false);
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
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${fieldPrefix}: Failed parsing JSON: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  buildMutationPublishEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { references: EntityVersionReference[] }>({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('AdminEntityPublishPayload'))),
      args: {
        references: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(this.getInputType('EntityVersionReferenceInput'))),
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
            new GraphQLList(new GraphQLNonNull(this.getInputType('EntityReferenceInput'))),
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

  buildMutationType<TSource>(adminSchema: Schema): GraphQLObjectType | null {
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
        entitySpec.name,
      );
      fields[`update${entitySpec.name}Entity`] = this.buildMutationUpdateEntity(
        adminSchema,
        entitySpec.name,
      );
      fields[`upsert${entitySpec.name}Entity`] = this.buildMutationUpsertEntity(
        adminSchema,
        entitySpec.name,
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
      this.addPublishedComponentTypes(this.publishedSchema);
    }
    if (this.adminSchema) {
      this.addAdminSupportingTypes(this.adminSchema);
      this.addAdminEntityTypes(this.adminSchema);
      this.addAdminComponentTypes(this.adminSchema);
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
