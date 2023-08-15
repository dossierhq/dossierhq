import type {
  AdminEntityStatus,
  AdminQuery,
  AdminSchema,
  AdminSchemaSpecificationWithMigrations,
  AdminSearchQuery,
  ChangelogEvent,
  ChangelogQuery,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  Location,
  PagingInfo,
  PromiseResult,
  PublishedQuery,
  PublishedSchema,
  PublishedSearchQuery,
  PublishingEvent,
  UniqueIndexReference,
} from '@dossierhq/core';
import type { ResolvedAuthKey, Session } from './Session.js';
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
  type: string;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  updatedAt: Date;
  neverPublished: boolean;
}

export interface DatabaseAdminEntityCreateEntityArg {
  id: string | null;
  type: string;
  name: string;
  session: Session;
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
  status: AdminEntityStatus;
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
  status: AdminEntityStatus;
}

export interface DatabaseAdminEntityHistoryGetEntityInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  authKey: string;
  resolvedAuthKey: string;
}

export interface DatabaseAdminEntityHistoryGetVersionInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  version: number;
  createdAt: Date;
  createdBy: string;
}

export interface DatabaseAdminEntityPublishGetVersionInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  versionIsPublished: boolean;
  versionIsLatest: boolean;
  type: string;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  updatedAt: Date;
  validPublished: boolean | null;
  entityFields: DatabaseEntityFieldsPayload;
}

export interface DatabaseAdminEntityPublishUpdateEntityArg
  extends DatabaseResolvedEntityVersionReference {
  status: AdminEntityStatus;
}

export interface DatabaseAdminEntityPublishingCreateEventArg {
  session: Session;
  kind: 'publish' | 'unpublish' | 'archive' | 'unarchive';
  references: (DatabaseResolvedEntityVersionReference & { entityType: string })[];
  onlyLegacyEvents: boolean; //TODO remove when removing legacy publishing events and instead skip calling function in server
}

export interface DatabaseAdminEntityPublishingHistoryGetEntityInfoPayload
  extends DatabaseResolvedEntityReference {
  authKey: string;
  resolvedAuthKey: string;
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
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
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
  status: AdminEntityStatus;
  session: Session;
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
  type: string;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
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

export interface DatabaseManagementGetNextDirtyEntityPayload
  extends DatabaseAdminEntityWithResolvedReferencePayload {
  dirtyValidateLatest: boolean;
  dirtyValidatePublished: boolean;
  dirtyIndexLatest: boolean;
  dirtyIndexPublished: boolean;
}

export interface DatabaseManagementMarkEntitiesDirtySelectorArg {
  validateEntityTypes: string[];
  validateValueTypes: string[];
  indexEntityTypes: string[];
  indexValueTypes: string[];
}

export interface DatabaseManagementMarkEntitiesDirtyPayload {
  validationCount: number;
  indexCount: number;
}

export interface DatabaseEntityIndexesArg {
  fullTextSearchText: string;
  referenceIds: DatabaseResolvedEntityReference[];
  locations: Location[];
  valueTypes: string[];
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

export type DatabaseEventGetChangelogEventsPayload =
  DatabaseConnectionPayload<DatabaseEventChangelogEventPayload>;

export type DatabaseEventChangelogEventPayload = ChangelogEvent & {
  cursor: string;
};

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
  ): PromiseResult<
    DatabaseAdminEntityCreatePayload,
    typeof ErrorType.Conflict | typeof ErrorType.Generic
  >;

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

  adminEntityHistoryGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference,
  ): PromiseResult<
    DatabaseAdminEntityHistoryGetEntityInfoPayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  adminEntityHistoryGetVersionsInfo(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference,
  ): PromiseResult<DatabaseAdminEntityHistoryGetVersionInfoPayload[], typeof ErrorType.Generic>;

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
    values: DatabaseAdminEntityPublishUpdateEntityArg,
  ): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic>;

  adminEntityPublishingCreateEvents(
    context: TransactionContext,
    event: DatabaseAdminEntityPublishingCreateEventArg,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  adminEntityPublishingHistoryGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference,
  ): PromiseResult<
    DatabaseAdminEntityPublishingHistoryGetEntityInfoPayload,
    typeof ErrorType.NotFound | typeof ErrorType.Generic
  >;

  adminEntityPublishingHistoryGetEvents(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference,
  ): PromiseResult<PublishingEvent[], typeof ErrorType.Generic>;

  adminEntitySampleEntities(
    schema: AdminSchema,
    context: TransactionContext,
    query: AdminQuery | undefined,
    offset: number,
    limit: number,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<
    DatabaseAdminEntityPayload[],
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  adminEntitySearchEntities(
    schema: AdminSchema,
    context: TransactionContext,
    query: AdminSearchQuery | undefined,
    paging: DatabasePagingInfo,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<
    DatabaseAdminEntitySearchPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  adminEntitySearchTotalCount(
    schema: AdminSchema,
    context: TransactionContext,
    query: AdminQuery | undefined,
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
  ): PromiseResult<DatabaseEntityUpdateEntityPayload, typeof ErrorType.Generic>;

  adminEntityUpdateStatus(
    context: TransactionContext,
    status: AdminEntityStatus,
    reference: DatabaseResolvedEntityReference,
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
    status: AdminEntityStatus,
    references: DatabaseResolvedEntityReference[],
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
  ): PromiseResult<DatabaseAuthCreateSessionPayload, typeof ErrorType.Generic>;

  eventGetChangelogEvents(
    context: TransactionContext,
    query: ChangelogQuery,
    pagingInfo: DatabasePagingInfo,
  ): PromiseResult<
    DatabaseEventGetChangelogEventsPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

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
    query: PublishedQuery | undefined,
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
    query: PublishedSearchQuery | undefined,
    paging: DatabasePagingInfo,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<
    DatabasePublishedEntitySearchPayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  publishedEntitySearchTotalCount(
    schema: PublishedSchema,
    context: TransactionContext,
    query: PublishedQuery | undefined,
    resolvedAuthKeys: ResolvedAuthKey[],
  ): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

  schemaGetSpecification(
    context: TransactionContext,
  ): PromiseResult<AdminSchemaSpecificationWithMigrations | null, typeof ErrorType.Generic>;

  schemaUpdateCountEntitiesWithTypes(
    context: TransactionContext,
    entityTypes: string[],
  ): PromiseResult<number, typeof ErrorType.Generic>;

  schemaUpdateRenameTypes(
    context: TransactionContext,
    entityTypes: Record<string, string>,
    valueTypes: Record<string, string>,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  schemaUpdateDeleteValueTypesFromIndexes(
    context: TransactionContext,
    valueTypes: string[],
  ): PromiseResult<void, typeof ErrorType.Generic>;

  schemaUpdateModifyIndexes(
    context: TransactionContext,
    deleteUniqueValueIndexes: string[],
    renameUniqueValueIndexes: Record<string, string>,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  schemaUpdateSpecification(
    context: TransactionContext,
    session: Session,
    schemaSpec: AdminSchemaSpecificationWithMigrations,
  ): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic>;
}
