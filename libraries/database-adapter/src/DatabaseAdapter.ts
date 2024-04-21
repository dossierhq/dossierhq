import type {
  AdminEntityQuery,
  AdminEntitySharedQuery,
  EntityStatus,
  Schema,
  SchemaSpecificationWithMigrations,
  ArchiveEntitySyncEvent,
  ChangelogEventQuery,
  CreateEntitySyncEvent,
  CreatePrincipalChangelogEvent,
  CreatePrincipalSyncEvent,
  EntityChangelogEvent,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  LegacySchemaSpecificationWithMigrations,
  Location,
  PagingInfo,
  PromiseResult,
  PublishEntitiesSyncEvent,
  PublishedEntityQuery,
  PublishedEntitySharedQuery,
  PublishedSchema,
  SchemaChangelogEvent,
  SyncEvent,
  UnarchiveEntitySyncEvent,
  UniqueIndexReference,
  UnpublishEntitiesSyncEvent,
  UpdateEntitySyncEvent,
  UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import type { ResolvedAuthKey, Session, WriteSession } from './Session.js';
import type { Transaction, TransactionContext } from './TransactionContext.js';

export interface DatabasePagingInfo extends PagingInfo {
  after: string | null;
  afterInclusive: boolean;
  before: string | null;
  beforeInclusive: boolean;
  count: number;
}

export interface DatabaseConnectionPayload<T extends { cursor: string }> {
  hasMore: boolean;
  edges: T[];
}

export interface DatabaseResolvedEntityReference {
  entityInternalId: unknown;
}

export interface DatabaseResolvedEntityVersionReference {
  entityInternalId: unknown;
  entityVersionInternalId: unknown;
}

export interface DatabaseAdminEntityArchivingEntityInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  authKey: string;
  resolvedAuthKey: string;
  status: EntityStatus;
  updatedAt: Date;
  neverPublished: boolean;
}

export interface DatabaseAdminEntityCreateEntityArg {
  id: string | null;
  type: string;
  name: string;
  version: number;
  session: WriteSession;
  resolvedAuthKey: ResolvedAuthKey;
  publish: boolean;
  schemaVersion: number;
  encodeVersion: number;
  fields: Record<string, unknown>;
}

export interface DatabaseAdminEntityCreatePayload extends DatabaseResolvedEntityReference {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseAdminEntityPayload {
  id: string;
  type: string;
  name: string;
  version: number;
  authKey: string;
  status: EntityStatus;
  valid: boolean;
  validPublished: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  entityFields: DatabaseEntityFieldsPayload;
}

export interface DatabaseEntityFieldsPayload {
  schemaVersion: number;
  encodeVersion: number;
  fields: Record<string, unknown>;
}

export interface DatabaseAdminEntityGetOnePayload extends DatabaseAdminEntityPayload {
  resolvedAuthKey: string;
}

export interface DatabaseAdminEntityWithResolvedReferencePayload
  extends DatabaseAdminEntityPayload,
    DatabaseResolvedEntityReference {}

export interface DatabaseAdminEntityGetReferenceEntityInfoPayload
  extends DatabaseResolvedEntityReference {
  id: string;
  type: string;
  status: EntityStatus;
}

export interface DatabaseAdminEntityPublishGetVersionInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  versionIsPublished: boolean;
  versionIsLatest: boolean;
  type: string;
  authKey: string;
  resolvedAuthKey: string;
  name: string;
  publishedName: string | null;
  status: EntityStatus;
  updatedAt: Date;
  validPublished: boolean | null;
  entityFields: DatabaseEntityFieldsPayload;
}

export interface DatabaseAdminEntityPublishUpdateEntityArg
  extends DatabaseResolvedEntityVersionReference {
  status: EntityStatus;
  publishedName: string;
  changePublishedName: boolean;
}

export interface DatabaseAdminEntityPublishUpdateEntityPayload
  extends DatabaseAdminEntityUpdateStatusPayload {
  publishedName: string;
}

export interface DatabaseAdminEntityCreateEntityEventArg {
  session: WriteSession;
  type: EntityChangelogEvent['type'];
  references: { entityVersionInternalId: unknown; publishedName?: string }[];
}

export type DatabaseAdminEntitySearchPayload =
  DatabaseConnectionPayload<DatabaseAdminEntitySearchPayloadEntity>;

export interface DatabaseAdminEntitySearchPayloadEntity extends DatabaseAdminEntityPayload {
  cursor: string;
}

export interface DatabaseAdminEntityUniqueIndexReference {
  index: string;
  value: string;
}

export interface DatabaseAdminEntityUniqueIndexValue {
  index: string;
  value: string;
  latest: boolean;
  published: boolean;
}

export interface DatabaseAdminEntityUniqueIndexArg {
  add: DatabaseAdminEntityUniqueIndexValue[];
  update: DatabaseAdminEntityUniqueIndexValue[];
  remove: DatabaseAdminEntityUniqueIndexReference[];
}

export interface DatabaseAdminEntityUniqueIndexPayload {
  conflictingValues: DatabaseAdminEntityUniqueIndexValue[];
}

export interface DatabaseEntityUpdateGetEntityInfoPayload extends DatabaseResolvedEntityReference {
  type: string;
  name: string;
  publishedName: string | null;
  authKey: string;
  resolvedAuthKey: string;
  status: EntityStatus;
  valid: boolean;
  validPublished: boolean | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  entityFields: DatabaseEntityFieldsPayload;
}

export interface DatabaseEntityUpdateEntityArg extends DatabaseResolvedEntityReference {
  name: string;
  changeName: boolean;
  version: number;
  type: string;
  publish: boolean;
  status: EntityStatus;
  session: WriteSession;
  schemaVersion: number;
  encodeVersion: number;
  fields: Record<string, unknown>;
}

export interface DatabaseEntityUpdateEntityPayload {
  name: string;
  updatedAt: Date;
}

export interface DatabaseAdminEntityUpdateStatusPayload {
  updatedAt: Date;
}

export interface DatabaseAdminEntityUnpublishGetEntityInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  id: string;
  authKey: string;
  resolvedAuthKey: string;
  status: EntityStatus;
  updatedAt: Date;
}

export interface DatabaseAdminEntityUnpublishUpdateEntityPayload
  extends DatabaseResolvedEntityReference {
  updatedAt: Date;
}

export interface DatabaseAuthCreateSessionPayload {
  principalEffect: 'created' | 'none';
  session: Session;
}

export interface DatabaseAuthSyncPrincipal {
  provider: string;
  identifier: string;
  subjectId: string;
}

export type DatabaseAuthGetPrincipalsPayload = DatabaseConnectionPayload<
  DatabaseAuthSyncPrincipal & {
    cursor: string;
  }
>;

export interface DatabaseManagementGetNextDirtyEntityPayload
  extends DatabaseAdminEntityWithResolvedReferencePayload {
  dirtyValidateLatest: boolean;
  dirtyValidatePublished: boolean;
  dirtyIndexLatest: boolean;
  dirtyIndexPublished: boolean;
}

export interface DatabaseManagementMarkEntitiesDirtySelectorArg {
  validateEntityTypes: string[];
  validateComponentTypes: string[];
  indexEntityTypes: string[];
  indexComponentTypes: string[];
}

export interface DatabaseManagementMarkEntitiesDirtyPayload {
  validationCount: number;
  indexCount: number;
}

export interface DatabaseManagementSyncGetEventsQuery {
  after: string | null;
  limit: number;
}

export interface DatabaseManagementSyncGetEventsPayload {
  events: SyncEvent[];
  hasMore: boolean;
}

export interface DatabaseEntityIndexesArg {
  fullTextSearchText: string;
  referenceIds: DatabaseResolvedEntityReference[];
  locations: Location[];
  componentTypes: string[];
}

export interface DatabasePublishedEntityPayload {
  id: string;
  name: string;
  type: string;
  authKey: string;
  createdAt: Date;
  validPublished: boolean;
  entityFields: DatabaseEntityFieldsPayload;
}

export interface DatabasePublishedEntityGetOnePayload extends DatabasePublishedEntityPayload {
  resolvedAuthKey: string;
}

export type DatabasePublishedEntitySearchPayload =
  DatabaseConnectionPayload<DatabasePublishedEntitySearchPayloadEntity>;

export interface DatabasePublishedEntitySearchPayloadEntity extends DatabasePublishedEntityPayload {
  cursor: string;
}

export interface DatabaseEventGetChangelogEventsEntityInfoPayload
  extends DatabaseResolvedEntityReference {
  authKey: string;
  resolvedAuthKey: string;
}

export type DatabaseEventGetChangelogEventsPayload =
  DatabaseConnectionPayload<DatabaseEventChangelogEventPayload>;

export type DatabaseEventChangelogEntityEventPayload = Omit<
  EntityChangelogEvent,
  'entities' | 'unauthorizedEntityCount'
> & {
  entities: {
    id: string;
    name: string;
    version: number;
    type: string;
    authKey: string;
    resolvedAuthKey: string;
  }[];
  cursor: string;
};

export type DatabaseEventChangelogEventPayload =
  | (CreatePrincipalChangelogEvent & { cursor: string })
  | (SchemaChangelogEvent & { cursor: string })
  | DatabaseEventChangelogEntityEventPayload;

export interface DatabaseOptimizationOptions {
  all?: boolean;
}

export interface DatabaseAdapter<
  TOptimizationOptions extends DatabaseOptimizationOptions = DatabaseOptimizationOptions,
> {
  disconnect(): Promise<void>;

  withRootTransaction<TOk, TError extends ErrorType, TContext extends TransactionContext>(
    context: TransactionContext,
    childContextFactory: (transaction: Transaction) => TContext,
    callback: (context: TContext) => PromiseResult<TOk, TError>,
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic>;

  withNestedTransaction<TOk, TError extends ErrorType>(
    context: TransactionContext,
    transaction: Transaction,
    callback: () => PromiseResult<TOk, TError>,
  ): PromiseResult<TOk, TError | typeof ErrorType.Generic>;

  adminEntityArchivingGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference,
  ): PromiseResult<
    DatabaseAdminEntityArchivingEntityInfoPayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  adminEntityCreate(
    context: TransactionContext,
    randomNameGenerator: (name: string) => string,
    entity: DatabaseAdminEntityCreateEntityArg,
    syncEvent: CreateEntitySyncEvent | null,
  ): PromiseResult<
    DatabaseAdminEntityCreatePayload,
    typeof ErrorType.Conflict | typeof ErrorType.Generic
  >;

  adminEntityCreateEntityEvent(
    context: TransactionContext,
    event: DatabaseAdminEntityCreateEntityEventArg,
    syncEvent: Exclude<Exclude<SyncEvent, UpdateSchemaSyncEvent>, CreatePrincipalSyncEvent> | null,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  adminEntityGetEntityName(
    context: TransactionContext,
    reference: EntityReference,
  ): PromiseResult<string, typeof ErrorType.NotFound | typeof ErrorType.Generic>;

  adminEntityGetOne(
    context: TransactionContext,
    reference: EntityReference | EntityVersionReference | UniqueIndexReference,
  ): PromiseResult<
    DatabaseAdminEntityGetOnePayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  adminEntityGetMultiple(
    context: TransactionContext,
    references: EntityReference[],
  ): PromiseResult<DatabaseAdminEntityGetOnePayload[], typeof ErrorType.Generic>;

  adminEntityGetReferenceEntitiesInfo(
    context: TransactionContext,
    references: EntityReference[],
  ): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], typeof ErrorType.Generic>;

  adminEntityIndexesUpdateLatest(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference,
    entityIndexes: DatabaseEntityIndexesArg,
    create: boolean,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  adminEntityIndexesUpdatePublished(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference,
    entityIndexes: DatabaseEntityIndexesArg,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  adminEntityPublishGetVersionInfo(
    context: TransactionContext,
    reference: EntityVersionReference,
  ): PromiseResult<
    DatabaseAdminEntityPublishGetVersionInfoPayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  adminEntityPublishUpdateEntity(
    context: TransactionContext,
    randomNameGenerator: (name: string) => string,
    values: DatabaseAdminEntityPublishUpdateEntityArg,
    syncEvent: PublishEntitiesSyncEvent | CreateEntitySyncEvent | UpdateEntitySyncEvent | null,
  ): PromiseResult<DatabaseAdminEntityPublishUpdateEntityPayload, typeof ErrorType.Generic>;

  adminEntitySampleEntities(
    schema: Schema,
    context: TransactionContext,
    query: AdminEntitySharedQuery | undefined,
    offset: number,
    limit: number,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<
    DatabaseAdminEntityPayload[],
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  adminEntitySearchEntities(
    schema: Schema,
    context: TransactionContext,
    query: AdminEntityQuery | undefined,
    paging: DatabasePagingInfo,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<
    DatabaseAdminEntitySearchPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  adminEntitySearchTotalCount(
    schema: Schema,
    context: TransactionContext,
    query: AdminEntitySharedQuery | undefined,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

  adminEntityUniqueIndexGetValues(
    context: TransactionContext,
    entity: DatabaseResolvedEntityReference,
  ): PromiseResult<DatabaseAdminEntityUniqueIndexValue[], typeof ErrorType.Generic>;

  adminEntityUniqueIndexUpdateValues(
    context: TransactionContext,
    entity: DatabaseResolvedEntityReference,
    values: DatabaseAdminEntityUniqueIndexArg,
  ): PromiseResult<DatabaseAdminEntityUniqueIndexPayload, typeof ErrorType.Generic>;

  adminEntityUpdateGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference,
  ): PromiseResult<
    DatabaseEntityUpdateGetEntityInfoPayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  adminEntityUpdateEntity(
    context: TransactionContext,
    randomNameGenerator: (name: string) => string,
    entity: DatabaseEntityUpdateEntityArg,
    syncEvent: UpdateEntitySyncEvent | null,
  ): PromiseResult<DatabaseEntityUpdateEntityPayload, typeof ErrorType.Generic>;

  adminEntityUpdateStatus(
    context: TransactionContext,
    status: EntityStatus,
    reference: DatabaseResolvedEntityReference,
    syncEvent: ArchiveEntitySyncEvent | UnarchiveEntitySyncEvent | null,
  ): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic>;

  adminEntityUnpublishGetEntitiesInfo(
    context: TransactionContext,
    references: EntityReference[],
  ): PromiseResult<
    DatabaseAdminEntityUnpublishGetEntityInfoPayload[],
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  adminEntityUnpublishEntities(
    context: TransactionContext,
    status: EntityStatus,
    references: DatabaseResolvedEntityReference[],
    syncEvent: UnpublishEntitiesSyncEvent | null,
  ): PromiseResult<DatabaseAdminEntityUnpublishUpdateEntityPayload[], typeof ErrorType.Generic>;

  adminEntityUnpublishGetPublishedReferencedEntities(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference,
  ): PromiseResult<EntityReference[], typeof ErrorType.Generic>;

  advisoryLockAcquire(
    context: TransactionContext,
    name: string,
    handle: number,
    leaseDuration: number,
  ): PromiseResult<{ acquiredAt: Date }, typeof ErrorType.Conflict | typeof ErrorType.Generic>;

  advisoryLockDeleteExpired(
    context: TransactionContext,
  ): PromiseResult<{ name: string }[], typeof ErrorType.Generic>;

  advisoryLockRelease(
    context: TransactionContext,
    name: string,
    handle: number,
  ): PromiseResult<void, typeof ErrorType.NotFound | typeof ErrorType.Generic>;

  advisoryLockRenew(
    context: TransactionContext,
    name: string,
    handle: number,
  ): PromiseResult<
    { acquiredAt: Date; renewedAt: Date },
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  authCreateSession(
    context: TransactionContext,
    provider: string,
    identifier: string,
    readOnly: boolean,
    syncEvent: CreatePrincipalSyncEvent | null,
  ): PromiseResult<DatabaseAuthCreateSessionPayload, typeof ErrorType.Generic>;

  authCreateSyncSessionForSubject(
    context: TransactionContext,
    arg: { subjectId: string },
  ): PromiseResult<WriteSession, typeof ErrorType.Generic>;

  authGetPrincipals(
    context: TransactionContext,
    paging: DatabasePagingInfo,
  ): PromiseResult<
    DatabaseAuthGetPrincipalsPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  authGetPrincipalsTotalCount(
    context: TransactionContext,
  ): PromiseResult<number, typeof ErrorType.Generic>;

  eventGetChangelogEvents(
    context: TransactionContext,
    query: ChangelogEventQuery,
    pagingInfo: DatabasePagingInfo,
    entity: DatabaseResolvedEntityReference | null,
  ): PromiseResult<
    DatabaseEventGetChangelogEventsPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  eventGetChangelogEventsEntityInfo(
    context: TransactionContext,
    reference: EntityReference,
  ): PromiseResult<
    DatabaseEventGetChangelogEventsEntityInfoPayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  eventGetChangelogEventsTotalCount(
    context: TransactionContext,
    query: ChangelogEventQuery,
    entity: DatabaseResolvedEntityReference | null,
  ): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

  managementDirtyGetNextEntity(
    context: TransactionContext,
    filter: EntityReference | undefined,
  ): PromiseResult<
    DatabaseManagementGetNextDirtyEntityPayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  managementDirtyMarkEntities(
    context: TransactionContext,
    selector: DatabaseManagementMarkEntitiesDirtySelectorArg,
  ): PromiseResult<DatabaseManagementMarkEntitiesDirtyPayload, typeof ErrorType.Generic>;

  managementDirtyUpdateEntity(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference,
    valid: boolean,
    validPublished: boolean | null,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  managementOptimize(
    context: TransactionContext,
    options: TOptimizationOptions,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  managementSyncGetEvents(
    context: TransactionContext,
    query: DatabaseManagementSyncGetEventsQuery,
  ): PromiseResult<
    DatabaseManagementSyncGetEventsPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  managementSyncGetHeadEventId(
    context: TransactionContext,
  ): PromiseResult<string | null, typeof ErrorType.Generic>;

  publishedEntityGetOne(
    context: TransactionContext,
    reference: EntityReference | UniqueIndexReference,
  ): PromiseResult<
    DatabasePublishedEntityGetOnePayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  publishedEntityGetEntities(
    context: TransactionContext,
    references: EntityReference[],
  ): PromiseResult<DatabasePublishedEntityGetOnePayload[], typeof ErrorType.Generic>;

  publishedEntitySampleEntities(
    schema: PublishedSchema,
    context: TransactionContext,
    query: PublishedEntitySharedQuery | undefined,
    offset: number,
    limit: number,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<
    DatabasePublishedEntityPayload[],
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  publishedEntitySearchEntities(
    schema: PublishedSchema,
    context: TransactionContext,
    query: PublishedEntityQuery | undefined,
    paging: DatabasePagingInfo,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<
    DatabasePublishedEntitySearchPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  publishedEntitySearchTotalCount(
    schema: PublishedSchema,
    context: TransactionContext,
    query: PublishedEntitySharedQuery | undefined,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

  schemaGetSpecification(
    context: TransactionContext,
  ): PromiseResult<
    SchemaSpecificationWithMigrations | LegacySchemaSpecificationWithMigrations | null,
    typeof ErrorType.Generic
  >;

  schemaUpdateCountEntitiesWithTypes(
    context: TransactionContext,
    entityTypes: string[],
  ): PromiseResult<number, typeof ErrorType.Generic>;

  schemaUpdateRenameTypes(
    context: TransactionContext,
    entityTypes: Record<string, string>,
    componentTypes: Record<string, string>,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  schemaUpdateDeleteComponentTypesFromIndexes(
    context: TransactionContext,
    componentTypes: string[],
  ): PromiseResult<void, typeof ErrorType.Generic>;

  schemaUpdateModifyIndexes(
    context: TransactionContext,
    deleteUniqueValueIndexes: string[],
    renameUniqueValueIndexes: Record<string, string>,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  schemaUpdateSpecification(
    context: TransactionContext,
    session: WriteSession,
    schemaSpec: SchemaSpecificationWithMigrations,
    syncEvent: UpdateSchemaSyncEvent | null,
  ): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic>;
}
