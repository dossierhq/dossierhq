import {
  EventType,
  FieldType,
  isComponentItemField,
  notOk,
  type DossierClient,
  type AdvisoryLockOptions,
  type ChangelogEvent,
  type ChangelogEventQuery,
  type Component,
  type ComponentTypeSpecification,
  type Entity,
  type EntityCreate,
  type EntityQuery,
  type EntityReference,
  type EntitySharedQuery,
  type EntityTypeSpecification,
  type EntityUpdate,
  type EntityUpsert,
  type EntityVersionReference,
  type ErrorType,
  type PublishedDossierClient,
  type PublishedComponentTypeSpecification,
  type PublishedEntity,
  type PublishedEntityQuery,
  type PublishedEntitySharedQuery,
  type PublishedEntityTypeSpecification,
  type PublishedSchema,
  type Result,
  type Schema,
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
  isComponent,
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
  client: Result<
    DossierClient<Entity> | DossierClient<Entity<string, object>, Component<string, object>>,
    typeof ErrorType.NotAuthenticated
  >;
  publishedClient: Result<
    | PublishedDossierClient<PublishedEntity>
    | PublishedDossierClient<PublishedEntity<string, object>, Component<string, object>>,
    typeof ErrorType.NotAuthenticated
  >;
}

function fieldConfigWithArgs<TSource, TContext, TArgs>(
  config: GraphQLFieldConfig<TSource, TContext, TArgs>,
): GraphQLFieldConfig<TSource, TContext> {
  return config as GraphQLFieldConfig<TSource, TContext>;
}

export class GraphQLSchemaGenerator<TContext extends SessionGraphQLContext> extends TypeRepository {
  private readonly schema: Schema | null;
  private readonly publishedSchema: PublishedSchema | null;

  constructor({
    schema,
    publishedSchema,
  }: {
    schema: Schema | null;
    publishedSchema: PublishedSchema | null;
  }) {
    super();
    this.schema = schema;
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
      !!(this.schema && this.schema.getEntityTypeCount() > 0) ||
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
          name: toPublishedTypeName('Component'),
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

  addPublishedEntityTypes(publishedSchema: PublishedSchema): void {
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      this.addPublishedEntityType(entitySpec);
    }
  }

  addPublishedEntityType(entitySpec: PublishedEntityTypeSpecification): void {
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
        interfaces: this.getInterfaces(toPublishedTypeName('Component')),
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

  addAdminSupportingTypes(schema: Schema): void {
    if (schema.getEntityTypeCount() === 0) {
      return;
    }

    this.addChangelogSupportingTypes();

    // EntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const entitySpec of schema.spec.entityTypes) {
      entityTypeEnumValues[entitySpec.name] = {};
    }
    this.addType(
      new GraphQLEnumType({
        name: 'EntityType',
        values: entityTypeEnumValues,
      }),
    );

    if (schema.getComponentTypeCount() > 0) {
      // ComponentType
      const componentTypeEnumValues: GraphQLEnumValueConfigMap = {};
      for (const componentSpec of schema.spec.componentTypes) {
        componentTypeEnumValues[componentSpec.name] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'ComponentType',
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
          type: { type: new GraphQLNonNull(this.getOutputType('EntityType')) },
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

    // EntityCreateInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityCreateInfo',
        fields: {
          type: { type: this.getEnumType('EntityType') },
          name: { type: new GraphQLNonNull(GraphQLString) },
          version: { type: GraphQLInt },
          authKey: { type: GraphQLString },
        },
      }),
    );

    // EntityCreateEffect
    this.addType(
      new GraphQLEnumType({
        name: 'EntityCreateEffect',
        values: {
          created: {},
          createdAndPublished: {},
          none: {},
        },
      }),
    );

    // EntityUpdateInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityUpdateInfo',
        fields: {
          type: { type: this.getEnumType('EntityType') },
          name: { type: GraphQLString },
          version: { type: GraphQLInt },
          authKey: { type: GraphQLString },
        },
      }),
    );

    // EntityUpdateEffect
    this.addType(
      new GraphQLEnumType({
        name: 'EntityUpdateEffect',
        values: {
          updated: {},
          updatedAndPublished: {},
          published: {},
          none: {},
        },
      }),
    );

    // EntityUpsertInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityUpsertInfo',
        fields: {
          type: { type: new GraphQLNonNull(this.getEnumType('EntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          authKey: { type: GraphQLString },
        },
      }),
    );

    // EntityUpsertEffect
    this.addType(
      new GraphQLEnumType({
        name: 'EntityUpsertEffect',
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

    // Entity
    this.addType(
      new GraphQLInterfaceType({
        name: 'Entity',
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

    // UniqueIndex
    const uniqueIndexNames = schema.spec.indexes
      .filter((it) => it.type === 'unique')
      .map((it) => it.name);
    if (uniqueIndexNames.length > 0) {
      const uniqueIndexEnumValues: GraphQLEnumValueConfigMap = {};
      for (const indexName of uniqueIndexNames) {
        uniqueIndexEnumValues[indexName] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'UniqueIndex',
          values: uniqueIndexEnumValues,
        }),
      );
    }

    // EntityEdge
    this.addType(
      new GraphQLObjectType({
        name: 'EntityEdge',
        fields: {
          node: { type: this.getOutputType('Entity') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      }),
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
      }),
    );

    // EntitySamplingPayload
    this.addType(
      new GraphQLObjectType({
        name: 'EntitySamplingPayload',
        fields: {
          seed: { type: new GraphQLNonNull(GraphQLInt) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
          items: { type: new GraphQLList(this.getOutputType('Entity')) },
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

    // EntitySharedQueryInput
    const sharedQueryInputFields = {
      authKeys: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      entityTypes: {
        type: new GraphQLList(new GraphQLNonNull(this.getEnumType('EntityType'))),
      },
      ...(schema.getComponentTypeCount() > 0
        ? {
            componentTypes: {
              type: new GraphQLList(new GraphQLNonNull(this.getEnumType('ComponentType'))),
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
        name: 'EntitySharedQueryInput',
        fields: sharedQueryInputFields,
      }),
    );

    // EntityQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityQueryInput',
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

    if (this.schema && this.schema.getComponentTypeCount() > 0) {
      // Component
      this.addType(
        new GraphQLInterfaceType({
          name: 'Component',
          fields: {
            type: { type: new GraphQLNonNull(this.getEnumType('ComponentType')) },
          },
        }),
      );
    }

    // RichText
    this.addType(
      new GraphQLObjectType({
        name: 'RichText',
        fields: {
          root: { type: new GraphQLNonNull(GraphQLJSONObject) },
          entities: { type: new GraphQLList(this.getInterface('Entity')) },
        },
      }),
    );

    // RichTextInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'RichTextInput',
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

    // EntityPublishEffect
    this.addType(
      new GraphQLEnumType({
        name: 'EntityPublishEffect',
        values: {
          published: {},
          none: {},
        },
      }),
    );

    // EntityPublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'EntityPublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('EntityPublishEffect')) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // EntityUnpublishEffect
    this.addType(
      new GraphQLEnumType({
        name: 'EntityUnpublishEffect',
        values: {
          unpublished: {},
          none: {},
        },
      }),
    );

    // EntityUnpublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'EntityUnpublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('EntityUnpublishEffect')) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // EntityArchiveEffect
    this.addType(
      new GraphQLEnumType({
        name: 'EntityArchiveEffect',
        values: {
          archived: {},
          none: {},
        },
      }),
    );

    // EntityArchivePayload
    this.addType(
      new GraphQLObjectType({
        name: 'EntityArchivePayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('EntityArchiveEffect')) },
          updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
        },
      }),
    );

    // EntityUnarchiveEffect
    this.addType(
      new GraphQLEnumType({
        name: 'EntityUnarchiveEffect',
        values: {
          unarchived: {},
          none: {},
        },
      }),
    );

    // EntityUnarchivePayload
    this.addType(
      new GraphQLObjectType({
        name: 'EntityUnarchivePayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          status: { type: new GraphQLNonNull(this.getEnumType('EntityStatus')) },
          effect: { type: new GraphQLNonNull(this.getEnumType('EntityUnarchiveEffect')) },
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

  addEntityTypes(schema: Schema): void {
    for (const entitySpec of schema.spec.entityTypes) {
      this.addEntityType(entitySpec);
    }
  }

  addEntityType(entitySpec: EntityTypeSpecification): void {
    // FooFields
    const fieldsName =
      entitySpec.fields.length > 0 ? `${toAdminTypeName(entitySpec.name)}Fields` : null;
    if (fieldsName) {
      this.addType(
        new GraphQLObjectType<Entity['fields'], TContext>({
          name: fieldsName,
          fields: () => {
            const fields: GraphQLFieldConfigMap<Entity['fields'], TContext> = {};
            this.addTypeSpecificationOutputFields(entitySpec, fields, true);
            return fields;
          },
        }),
      );
    }

    // Foo
    this.addType(
      new GraphQLObjectType<Entity, TContext>({
        name: toAdminTypeName(entitySpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Entity')),
        isTypeOf: (source, _context, _info) => source.info.type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
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

    // FooFieldsInput
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

    // FooCreateInput
    this.addType(
      new GraphQLInputObjectType({
        name: toAdminCreateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: GraphQLID },
            info: { type: new GraphQLNonNull(this.getInputType('EntityCreateInfo')) },
          };
          if (inputFieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getInputType(inputFieldsName)) };
          }
          return fields;
        },
      }),
    );

    // FooCreatePayload
    this.addType(
      new GraphQLObjectType({
        name: toAdminCreatePayloadTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            effect: { type: new GraphQLNonNull(this.getEnumType('EntityCreateEffect')) },
            entity: {
              type: new GraphQLNonNull(this.getOutputType(toAdminTypeName(entitySpec.name))),
            },
          };
          return fields;
        },
      }),
    );

    // FooUpdateInput
    this.addType(
      new GraphQLInputObjectType({
        name: toAdminUpdateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: this.getInputType('EntityUpdateInfo') },
          };
          if (inputFieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getInputType(inputFieldsName)) };
          }
          return fields;
        },
      }),
    );

    // FooUpdatePayload
    this.addType(
      new GraphQLObjectType({
        name: toAdminUpdatePayloadTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            effect: { type: new GraphQLNonNull(this.getEnumType('EntityUpdateEffect')) },
            entity: {
              type: new GraphQLNonNull(this.getOutputType(toAdminTypeName(entitySpec.name))),
            },
          };
          return fields;
        },
      }),
    );

    // FooUpsertInput
    this.addType(
      new GraphQLInputObjectType({
        name: toAdminUpsertInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: new GraphQLNonNull(this.getInputType('EntityUpsertInfo')) },
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
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            effect: { type: new GraphQLNonNull(this.getEnumType('EntityUpsertEffect')) },
            entity: {
              type: new GraphQLNonNull(this.getOutputType(toAdminTypeName(entitySpec.name))),
            },
          };
          return fields;
        },
      }),
    );
  }

  addAdminComponentTypes(schema: Schema): void {
    for (const componentSpec of schema.spec.componentTypes) {
      this.addAdminComponentType(componentSpec);
    }
  }

  addAdminComponentType(componentSpec: ComponentTypeSpecification): void {
    // Foo
    this.addType(
      new GraphQLObjectType<Component, TContext>({
        name: toAdminTypeName(componentSpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Component')),
        isTypeOf: (source, _context, _info) => source.type === componentSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Component, TContext> = {
            type: { type: new GraphQLNonNull(this.getEnumType('ComponentType')) },
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
            type: { type: new GraphQLNonNull(this.getEnumType('ComponentType')) },
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
          fieldType = this.getInputType('RichTextInput');
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

  buildQueryFieldAdminEntity<TSource>(schema: Schema): GraphQLFieldConfig<TSource, TContext> {
    if (schema.spec.indexes.length === 0) {
      return fieldConfigWithArgs<TSource, TContext, { id: string; version?: number | null }>({
        type: this.getInterface('Entity'),
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

          return await loadAdminEntity(schema, context, reference);
        },
      });
    }
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { id?: string | null; version?: number | null; index?: string | null; value?: string | null }
    >({
      type: this.getInterface('Entity'),
      args: {
        id: { type: GraphQLID },
        version: { type: GraphQLInt },
        index: { type: this.getInputType('UniqueIndex') },
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

        return await loadAdminEntity(schema, context, reference);
      },
    });
  }

  buildQueryFieldAdminEntityList<TSource>(schema: Schema): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('Entity')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadAdminEntityList(schema, context, args.ids);
      },
    });
  }

  buildQueryFieldAdminEntitiesSample<TSource>(
    schema: Schema,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: EntitySharedQuery;
        seed?: number;
        count?: number;
      }
    >({
      type: this.getOutputType('EntitySamplingPayload'),
      args: {
        query: { type: this.getInputType('EntitySharedQueryInput') },
        seed: { type: GraphQLInt },
        count: { type: GraphQLInt },
      },
      resolve: async (_source, args, context, _info) => {
        const { query, seed, count } = args;
        const options = { seed, count };
        return await loadAdminEntitiesSample(schema, context, query, options);
      },
    });
  }

  buildQueryFieldAdminEntities<TSource>(schema: Schema): GraphQLFieldConfig<TSource, TContext> {
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
      type: this.getOutputType('EntityConnection'),
      args: {
        query: { type: this.getInputType('EntityQueryInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (_source, args, context, info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadAdminEntities(schema, context, query, paging, info);
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
        ...(this.schema && this.schema.getEntityTypeCount() > 0
          ? {
              entity: this.buildQueryFieldAdminEntity(this.schema),
              entityList: this.buildQueryFieldAdminEntityList(this.schema),
              entities: this.buildQueryFieldAdminEntities(this.schema),
              entitiesSample: this.buildQueryFieldAdminEntitiesSample(this.schema),
              changelogEvents: this.buildQueryFieldChangelogEvents(),
            }
          : {}),
      },
    });
  }

  buildMutationCreateEntity<TSource>(
    schema: Schema,
    entityName: string,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { entity: EntityCreate; publish: boolean | null }
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
        this.resolveJsonInputFields(schema, entity, entityName);
        return await Mutations.createEntity(schema, context, entity, {
          publish: publish ?? undefined,
        });
      },
    });
  }

  buildMutationUpdateEntity<TSource>(
    schema: Schema,
    entityName: string,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { entity: EntityUpdate; publish: boolean | null }
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
        this.resolveJsonInputFields(schema, entity, entityName);
        return await Mutations.updateEntity(schema, context, entity, {
          publish: publish ?? undefined,
        });
      },
    });
  }

  buildMutationUpsertEntity<TSource>(
    schema: Schema,
    entityName: string,
  ): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      { entity: EntityUpsert; publish: boolean | null }
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
        this.resolveJsonInputFields(schema, entity, entityName);
        return await Mutations.upsertEntity(schema, context, entity, {
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
    schema: Schema,
    entity: EntityCreate | EntityUpdate,
    entityTypeName: string,
  ): void {
    const visitItem = (
      item: EntityCreate | EntityUpdate | Component,
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
          ? schema.getEntityFieldSpecification(typeSpec as EntityTypeSpecification, fieldName)
          : schema.getComponentFieldSpecification(typeSpec, fieldName);

        // Traverse into components
        if (fieldSpec && isComponentItemField(fieldSpec, fieldValue) && fieldValue) {
          const type = fieldValue.type;
          const componentSpec = schema.getComponentTypeSpecification(type);
          if (!componentSpec) {
            throw new Error(`${fieldPrefix}: No such type ${type}`);
          }

          visitItem(fieldValue, componentSpec, fieldPrefix, false);
        }
      }
    };

    const entitySpec = schema.getEntityTypeSpecification(entityTypeName);
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
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('EntityPublishPayload'))),
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
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('EntityUnpublishPayload'))),
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
      type: this.getOutputType('EntityArchivePayload'),
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
      type: this.getOutputType('EntityUnarchivePayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await Mutations.unarchiveEntity(context, { id });
      },
    });
  }

  buildMutationType<TSource>(schema: Schema): GraphQLObjectType | null {
    const includeEntities = schema.getEntityTypeCount() > 0;
    if (!includeEntities) {
      return null;
    }

    const fields: GraphQLFieldConfigMap<TSource, TContext> = {
      publishEntities: this.buildMutationPublishEntities(),
      unpublishEntities: this.buildMutationUnpublishEntities(),
      archiveEntity: this.buildMutationArchiveEntity(),
      unarchiveEntity: this.buildMutationUnarchiveEntity(),
    };

    for (const entitySpec of schema.spec.entityTypes) {
      fields[`create${entitySpec.name}Entity`] = this.buildMutationCreateEntity(
        schema,
        entitySpec.name,
      );
      fields[`update${entitySpec.name}Entity`] = this.buildMutationUpdateEntity(
        schema,
        entitySpec.name,
      );
      fields[`upsert${entitySpec.name}Entity`] = this.buildMutationUpsertEntity(
        schema,
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
      this.addPublishedEntityTypes(this.publishedSchema);
      this.addPublishedComponentTypes(this.publishedSchema);
    }
    if (this.schema) {
      this.addAdminSupportingTypes(this.schema);
      this.addEntityTypes(this.schema);
      this.addAdminComponentTypes(this.schema);
    }

    const queryType = this.buildQueryType<TSource>();
    let mutationType: GraphQLObjectType | null = null;
    if (this.schema) {
      mutationType = this.buildMutationType<TSource>(this.schema);
    }

    return { query: queryType, mutation: mutationType, types: this.getTypes() };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
