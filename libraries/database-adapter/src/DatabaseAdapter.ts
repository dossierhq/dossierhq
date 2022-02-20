import type {
  AdminEntityStatus,
  AdminQuery,
  AdminSchema,
  AdminSchemaSpecification,
  AdminSearchQuery,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  Location,
  Paging,
  PromiseResult,
  PublishedQuery,
  PublishedSchema,
  PublishedSearchQuery,
  PublishingEvent,
} from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import type { ResolvedAuthKey, Session, Transaction, TransactionContext } from '.';

export interface DatabaseResolvedEntityReference {
  entityInternalId: unknown;
}

export interface DatabaseResolvedEntityVersionReference {
  entityInternalId: unknown;
  entityVersionInternalId: unknown;
}

export interface DatabaseAdminEntityArchivingEntityInfoPayload
  extends DatabaseResolvedEntityReference {
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  updatedAt: Temporal.Instant;
  neverPublished: boolean;
}

export interface DatabaseAdminEntityCreateEntityArg {
  id: string | null;
  type: string;
  name: string;
  creator: Session;
  resolvedAuthKey: ResolvedAuthKey;
  fullTextSearchText: string;
  locations: Location[];
  referenceIds: DatabaseResolvedEntityReference[];
  fieldsData: Record<string, unknown>;
}

export interface DatabaseAdminEntityCreatePayload {
  id: string;
  name: string;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
}

export interface DatabaseAdminEntityPayload {
  id: string;
  type: string;
  name: string;
  version: number;
  authKey: string;
  status: AdminEntityStatus;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
  fieldValues: Record<string, unknown>;
}

export interface DatabaseAdminEntityGetOnePayload extends DatabaseAdminEntityPayload {
  resolvedAuthKey: string;
}

export interface DatabaseAdminEntityGetReferenceEntityInfoPayload
  extends DatabaseResolvedEntityReference {
  id: string;
  type: string;
}

export interface DatabaseAdminEntityHistoryGetEntityInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  authKey: string;
  resolvedAuthKey: string;
}

export interface DatabaseAdminEntityHistoryGetVersionInfoPayload
  extends DatabaseResolvedEntityVersionReference {
  version: number;
  createdAt: Temporal.Instant;
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
  updatedAt: Temporal.Instant;
  fieldValues: Record<string, unknown>;
}

export interface DatabaseAdminEntityPublishUpdateEntityArg
  extends DatabaseResolvedEntityVersionReference {
  status: AdminEntityStatus;
  fullTextSearchText: string;
}

export type DatabaseAdminEntityPublishingCreateEventArg = { session: Session } & (
  | {
      kind: 'publish';
      references: DatabaseResolvedEntityVersionReference[];
    }
  | {
      kind: 'unpublish';
      references: DatabaseResolvedEntityReference[];
    }
  | {
      kind: 'archive';
      references: DatabaseResolvedEntityReference[];
    }
  | {
      kind: 'unarchive';
      references: DatabaseResolvedEntityReference[];
    }
);

export interface DatabaseAdminEntityPublishingHistoryGetEntityInfoPayload
  extends DatabaseResolvedEntityReference {
  authKey: string;
  resolvedAuthKey: string;
}

export interface DatabaseAdminEntitySearchPayload {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  entities: DatabaseAdminEntitySearchPayloadEntity[];
}

export interface DatabaseAdminEntitySearchPayloadEntity extends DatabaseAdminEntityPayload {
  cursor: string;
}

export interface DatabaseEntityUpdateGetEntityInfoPayload extends DatabaseResolvedEntityReference {
  type: string;
  name: string;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  version: number;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
  fieldValues: Record<string, unknown>;
}

export interface DatabaseEntityUpdateEntityArg extends DatabaseResolvedEntityReference {
  name: string;
  changeName: boolean;
  version: number;
  status: AdminEntityStatus;
  session: Session;
  fieldValues: Record<string, unknown>;
  fullTextSearchText: string;
  referenceIds: DatabaseResolvedEntityReference[];
  locations: Location[];
}

export interface DatabaseEntityUpdateEntityPayload {
  name: string;
  updatedAt: Temporal.Instant;
}

export interface DatabaseAdminEntityUpdateStatusPayload {
  updatedAt: Temporal.Instant;
}

export interface DatabaseAdminEntityUnpublishGetEntityInfoPayload
  extends DatabaseResolvedEntityReference {
  id: string;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  updatedAt: Temporal.Instant;
}

export interface DatabaseAdminEntityUnpublishUpdateEntityPayload
  extends DatabaseResolvedEntityReference {
  updatedAt: Temporal.Instant;
}

export interface DatabaseAuthCreateSessionPayload {
  principalEffect: 'created' | 'none';
  session: Session;
}

export interface DatabasePublishedEntityPayload {
  id: string;
  name: string;
  type: string;
  authKey: string;
  createdAt: Temporal.Instant;
  fieldValues: Record<string, unknown>;
}

export interface DatabasePublishedEntityGetOnePayload extends DatabasePublishedEntityPayload {
  resolvedAuthKey: string;
}

export interface DatabasePublishedEntitySearchPayload {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  entities: DatabasePublishedEntitySearchPayloadEntity[];
}

export interface DatabasePublishedEntitySearchPayloadEntity extends DatabasePublishedEntityPayload {
  cursor: string;
}

export interface DatabaseAdapter {
  disconnect(): Promise<void>;

  withRootTransaction<TOk, TError extends ErrorType>(
    callback: (transaction: Transaction) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  withNestedTransaction<TOk, TError extends ErrorType>(
    context: TransactionContext,
    transaction: Transaction,
    callback: () => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError | ErrorType.Generic>;

  adminEntityArchivingGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference
  ): PromiseResult<
    DatabaseAdminEntityArchivingEntityInfoPayload,
    ErrorType.NotFound | ErrorType.Generic
  >;

  adminEntityCreate(
    context: TransactionContext,
    randomNameGenerator: (name: string) => string,
    entity: DatabaseAdminEntityCreateEntityArg
  ): PromiseResult<DatabaseAdminEntityCreatePayload, ErrorType.Conflict | ErrorType.Generic>;

  adminEntityGetEntityName(
    context: TransactionContext,
    reference: EntityReference
  ): PromiseResult<string, ErrorType.NotFound | ErrorType.Generic>;

  adminEntityGetOne(
    context: TransactionContext,
    reference: EntityReference | EntityVersionReference
  ): PromiseResult<DatabaseAdminEntityGetOnePayload, ErrorType.NotFound | ErrorType.Generic>;

  adminEntityGetMultiple(
    context: TransactionContext,
    references: EntityReference[]
  ): PromiseResult<DatabaseAdminEntityGetOnePayload[], ErrorType.Generic>;

  adminEntityGetReferenceEntitiesInfo(
    context: TransactionContext,
    references: EntityReference[]
  ): PromiseResult<DatabaseAdminEntityGetReferenceEntityInfoPayload[], ErrorType.Generic>;

  adminEntityHistoryGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference
  ): PromiseResult<
    DatabaseAdminEntityHistoryGetEntityInfoPayload,
    ErrorType.NotFound | ErrorType.Generic
  >;

  adminEntityHistoryGetVersionsInfo(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference
  ): PromiseResult<DatabaseAdminEntityHistoryGetVersionInfoPayload[], ErrorType.Generic>;

  adminEntityPublishGetVersionInfo(
    context: TransactionContext,
    reference: EntityVersionReference
  ): PromiseResult<
    DatabaseAdminEntityPublishGetVersionInfoPayload,
    ErrorType.NotFound | ErrorType.Generic
  >;

  adminEntityPublishUpdateEntity(
    context: TransactionContext,
    values: DatabaseAdminEntityPublishUpdateEntityArg
  ): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, ErrorType.Generic>;

  adminEntityPublishGetUnpublishedReferencedEntities(
    context: TransactionContext,
    reference: DatabaseResolvedEntityVersionReference
  ): PromiseResult<EntityReference[], ErrorType.Generic>;

  adminEntityPublishingCreateEvents(
    context: TransactionContext,
    event: DatabaseAdminEntityPublishingCreateEventArg
  ): PromiseResult<void, ErrorType.Generic>;

  adminEntityPublishingHistoryGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference
  ): PromiseResult<
    DatabaseAdminEntityPublishingHistoryGetEntityInfoPayload,
    ErrorType.NotFound | ErrorType.Generic
  >;

  adminEntityPublishingHistoryGetEvents(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference
  ): PromiseResult<PublishingEvent[], ErrorType.Generic>;

  adminEntitySampleEntities(
    schema: AdminSchema,
    context: TransactionContext,
    query: AdminQuery | undefined,
    offset: number,
    limit: number,
    resolvedAuthKeys: ResolvedAuthKey[]
  ): PromiseResult<DatabaseAdminEntityPayload[], ErrorType.BadRequest | ErrorType.Generic>;

  adminEntitySearchEntities(
    schema: AdminSchema,
    context: TransactionContext,
    query: AdminSearchQuery | undefined,
    paging: Paging | undefined,
    resolvedAuthKeys: ResolvedAuthKey[]
  ): PromiseResult<DatabaseAdminEntitySearchPayload, ErrorType.BadRequest | ErrorType.Generic>;

  adminEntitySearchTotalCount(
    schema: AdminSchema,
    context: TransactionContext,
    query: AdminQuery | undefined,
    resolvedAuthKeys: ResolvedAuthKey[]
  ): PromiseResult<number, ErrorType.BadRequest | ErrorType.Generic>;

  adminEntityUpdateGetEntityInfo(
    context: TransactionContext,
    reference: EntityReference
  ): PromiseResult<
    DatabaseEntityUpdateGetEntityInfoPayload,
    ErrorType.NotFound | ErrorType.Generic
  >;

  adminEntityUpdateEntity(
    context: TransactionContext,
    randomNameGenerator: (name: string) => string,
    entity: DatabaseEntityUpdateEntityArg
  ): PromiseResult<DatabaseEntityUpdateEntityPayload, ErrorType.Generic>;

  adminEntityUpdateStatus(
    context: TransactionContext,
    status: AdminEntityStatus,
    reference: DatabaseResolvedEntityReference
  ): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, ErrorType.Generic>;

  adminEntityUnpublishGetEntitiesInfo(
    context: TransactionContext,
    references: EntityReference[]
  ): PromiseResult<
    DatabaseAdminEntityUnpublishGetEntityInfoPayload[],
    ErrorType.NotFound | ErrorType.Generic
  >;

  adminEntityUnpublishEntities(
    context: TransactionContext,
    status: AdminEntityStatus,
    references: DatabaseResolvedEntityReference[]
  ): PromiseResult<DatabaseAdminEntityUnpublishUpdateEntityPayload[], ErrorType.Generic>;

  adminEntityUnpublishGetPublishedReferencedEntities(
    context: TransactionContext,
    reference: DatabaseResolvedEntityReference
  ): PromiseResult<EntityReference[], ErrorType.Generic>;

  authCreateSession(
    context: TransactionContext,
    provider: string,
    identifier: string
  ): PromiseResult<DatabaseAuthCreateSessionPayload, ErrorType.Generic>;

  publishedEntityGetOne(
    context: TransactionContext,
    reference: EntityReference
  ): PromiseResult<DatabasePublishedEntityGetOnePayload, ErrorType.NotFound | ErrorType.Generic>;

  publishedEntityGetEntities(
    context: TransactionContext,
    references: EntityReference[]
  ): PromiseResult<DatabasePublishedEntityGetOnePayload[], ErrorType.Generic>;

  publishedEntitySampleEntities(
    schema: PublishedSchema,
    context: TransactionContext,
    query: PublishedQuery | undefined,
    offset: number,
    limit: number,
    resolvedAuthKeys: ResolvedAuthKey[]
  ): PromiseResult<DatabasePublishedEntityPayload[], ErrorType.BadRequest | ErrorType.Generic>;

  publishedEntitySearchEntities(
    schema: PublishedSchema,
    context: TransactionContext,
    query: PublishedSearchQuery | undefined,
    paging: Paging | undefined,
    resolvedAuthKeys: ResolvedAuthKey[]
  ): PromiseResult<DatabasePublishedEntitySearchPayload, ErrorType.BadRequest | ErrorType.Generic>;

  publishedEntitySearchTotalCount(
    schema: PublishedSchema,
    context: TransactionContext,
    query: PublishedQuery | undefined,
    resolvedAuthKeys: ResolvedAuthKey[]
  ): PromiseResult<number, ErrorType.BadRequest | ErrorType.Generic>;

  schemaGetSpecification(
    context: TransactionContext
  ): PromiseResult<AdminSchemaSpecification | null, ErrorType.Generic>;

  schemaUpdateSpecification(
    context: TransactionContext,
    schemaSpec: AdminSchemaSpecification
  ): PromiseResult<void, ErrorType.Generic>;
}
