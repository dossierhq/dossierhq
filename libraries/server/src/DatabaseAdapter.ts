import type {
  AdminEntityStatus,
  AdminSchemaSpecification,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  Location,
  PromiseResult,
} from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import type { ResolvedAuthKey, Session, TransactionContext } from '.';

export interface Transaction {
  _type: 'Transaction';
}

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
  referenceIds: number[];
  fieldsData: Record<string, unknown>;
}

export interface DatabaseAdminEntityCreatePayload {
  id: string;
  name: string;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
}

export interface DatabaseAdminEntityGetOnePayload {
  id: string;
  type: string;
  name: string;
  version: number;
  authKey: string;
  resolvedAuthKey: string;
  status: AdminEntityStatus;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
  fieldValues: Record<string, unknown>;
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
  referenceIds: number[];
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

export interface DatabaseAdapter {
  disconnect(): Promise<void>;

  withRootTransaction<TOk, TError extends ErrorType>(
    callback: (transaction: Transaction) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  withNestedTransaction<TOk, TError extends ErrorType>(
    transaction: Transaction,
    callback: () => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

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

  schemaGetSpecification(
    context: TransactionContext
  ): PromiseResult<AdminSchemaSpecification | null, ErrorType.Generic>;

  schemaUpdateSpecification(
    context: TransactionContext,
    schemaSpec: AdminSchemaSpecification
  ): PromiseResult<void, ErrorType.Generic>;

  // TODO remove when migrated away
  queryLegacy<R = unknown>(
    transaction: Transaction | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;
}
