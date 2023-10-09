import type { DatabaseAdapter, DatabaseOptimizationOptions } from '@dossierhq/database-adapter';
import type { PostgresTransaction } from './PostgresTransaction.js';
import { withNestedTransaction, withRootTransaction } from './PostgresTransaction.js';
import { adminEntityArchivingGetEntityInfo } from './admin-entity/archivingGetEntityInfo.js';
import { adminCreateEntity } from './admin-entity/createEntity.js';
import { adminEntityCreateEntityEvent } from './admin-entity/createEntityEvent.js';
import { adminEntityGetMultiple } from './admin-entity/getEntities.js';
import { adminGetEntity } from './admin-entity/getEntity.js';
import { adminEntityGetEntityName } from './admin-entity/getEntityName.js';
import { adminEntityGetReferenceEntitiesInfo } from './admin-entity/getReferenceEntitiesInfo.js';
import { adminEntitySearchTotalCount } from './admin-entity/getTotalCount.js';
import { adminEntityIndexesUpdateLatest } from './admin-entity/indexesUpdateLatest.js';
import { adminEntityIndexesUpdatePublished } from './admin-entity/indexesUpdatePublished.js';
import {
  adminEntityPublishGetVersionInfo,
  adminEntityPublishUpdateEntity,
} from './admin-entity/publishEntities.js';
import { adminEntitySampleEntities } from './admin-entity/sampleEntities.js';
import { adminEntitySearchEntities } from './admin-entity/searchEntities.js';
import { adminEntityUniqueIndexGetValues } from './admin-entity/uniqueIndexGetValues.js';
import { adminEntityUniqueIndexUpdateValues } from './admin-entity/uniqueIndexUpdateValues.js';
import {
  adminEntityUnpublishEntities,
  adminEntityUnpublishGetEntitiesInfo,
  adminEntityUnpublishGetPublishedReferencedEntities,
} from './admin-entity/unpublishEntities.js';
import {
  adminEntityUpdateEntity,
  adminEntityUpdateGetEntityInfo,
} from './admin-entity/updateEntity.js';
import { adminEntityUpdateStatus } from './admin-entity/updateStatus.js';
import { advisoryLockAcquire } from './advisory-lock/advisoryLockAcquire.js';
import { advisoryLockDeleteExpired } from './advisory-lock/advisoryLockDeleteExpired.js';
import { advisoryLockRelease } from './advisory-lock/advisoryLockRelease.js';
import { advisoryLockRenew } from './advisory-lock/advisoryLockRenew.js';
import { authCreatePrincipal } from './auth/createPrincipal.js';
import { authCreateSession, authCreateSyncSessionForSubject } from './auth/createSession.js';
import { authGetPrincipals } from './auth/getPrincipals.js';
import { authGetPrincipalsTotalCount } from './auth/getPrincipalsTotalCount.js';
import { eventGetChangelogEvents } from './event/getChangelogEvents.js';
import { eventGetChangelogEventsEntityInfo } from './event/getChangelogEventsEntityInfo.js';
import { eventGetChangelogEventsTotalCount } from './event/getChangelogEventsTotalCount.js';
import { managementDirtyGetNextEntity } from './management/dirtyGetNextEntity.js';
import { managementDirtyMarkEntities } from './management/dirtyMarkEntities.js';
import { managementDirtyUpdateEntity } from './management/dirtyUpdateEntity.js';
import { managementOptimize } from './management/optimize.js';
import { managementSyncGetEvents } from './management/syncGetEvents.js';
import { managementSyncGetHeadEventId } from './management/syncGetHeadEventId.js';
import { publishedEntityGetEntities } from './published-entity/getEntities.js';
import { publishedEntityGetOne } from './published-entity/getEntity.js';
import { publishedEntitySearchTotalCount } from './published-entity/getTotalCount.js';
import { publishedEntitySampleEntities } from './published-entity/sampleEntities.js';
import { publishedEntitySearchEntities } from './published-entity/searchEntities.js';
import { schemaGetSpecification } from './schema/getSpecification.js';
import { schemaUpdateCountEntitiesWithTypes } from './schema/updateCountEntitiesWithTypes.js';
import { schemaUpdateDeleteComponentTypesFromIndexes } from './schema/updateDeleteComponentTypesFromIndexes.js';
import { schemaUpdateModifyIndexes } from './schema/updateModifyIndexes.js';
import { schemaUpdateRenameTypes } from './schema/updateRenameTypes.js';
import { schemaUpdateSpecification } from './schema/updateSpecification.js';

export type PostgresDatabaseOptimizationOptions = DatabaseOptimizationOptions;

export interface PostgresQueryResult<R> {
  rowCount?: number;
  rows: R[];
}

export interface PostgresDatabaseAdapter {
  disconnect(): Promise<void>;

  createTransaction(): Promise<PostgresTransaction>;

  query<R>(
    transaction: PostgresTransaction | null,
    query: string,
    values: unknown[] | undefined,
  ): Promise<PostgresQueryResult<R>>;

  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;

  base64Encode(value: string): string;
  base64Decode(value: string): string;
}

export function createPostgresDatabaseAdapterAdapter(
  databaseAdapter: PostgresDatabaseAdapter,
): DatabaseAdapter<PostgresDatabaseOptimizationOptions> {
  return {
    adminEntityArchivingGetEntityInfo: (...args) =>
      adminEntityArchivingGetEntityInfo(databaseAdapter, ...args),
    adminEntityCreate: (...args) => adminCreateEntity(databaseAdapter, ...args),
    adminEntityCreateEntityEvent: (...args) =>
      adminEntityCreateEntityEvent(databaseAdapter, ...args),
    adminEntityGetOne: (...args) => adminGetEntity(databaseAdapter, ...args),
    adminEntityGetMultiple: (...args) => adminEntityGetMultiple(databaseAdapter, ...args),
    adminEntityGetEntityName: (...args) => adminEntityGetEntityName(databaseAdapter, ...args),
    adminEntityGetReferenceEntitiesInfo: (...args) =>
      adminEntityGetReferenceEntitiesInfo(databaseAdapter, ...args),
    adminEntityIndexesUpdateLatest: (...args) =>
      adminEntityIndexesUpdateLatest(databaseAdapter, ...args),
    adminEntityIndexesUpdatePublished: (...args) =>
      adminEntityIndexesUpdatePublished(databaseAdapter, ...args),
    adminEntityPublishGetVersionInfo: (...args) =>
      adminEntityPublishGetVersionInfo(databaseAdapter, ...args),
    adminEntityPublishUpdateEntity: (...args) =>
      adminEntityPublishUpdateEntity(databaseAdapter, ...args),
    adminEntitySampleEntities: (...args) => adminEntitySampleEntities(databaseAdapter, ...args),
    adminEntitySearchEntities: (...args) => adminEntitySearchEntities(databaseAdapter, ...args),
    adminEntitySearchTotalCount: (...args) => adminEntitySearchTotalCount(databaseAdapter, ...args),
    adminEntityUniqueIndexGetValues: (...args) =>
      adminEntityUniqueIndexGetValues(databaseAdapter, ...args),
    adminEntityUniqueIndexUpdateValues: (...args) =>
      adminEntityUniqueIndexUpdateValues(databaseAdapter, ...args),
    adminEntityUpdateGetEntityInfo: (...args) =>
      adminEntityUpdateGetEntityInfo(databaseAdapter, ...args),
    adminEntityUpdateEntity: (...args) => adminEntityUpdateEntity(databaseAdapter, ...args),
    adminEntityUpdateStatus: (...args) => adminEntityUpdateStatus(databaseAdapter, ...args),
    adminEntityUnpublishGetEntitiesInfo: (...args) =>
      adminEntityUnpublishGetEntitiesInfo(databaseAdapter, ...args),
    adminEntityUnpublishEntities: (...args) =>
      adminEntityUnpublishEntities(databaseAdapter, ...args),
    adminEntityUnpublishGetPublishedReferencedEntities: (...args) =>
      adminEntityUnpublishGetPublishedReferencedEntities(databaseAdapter, ...args),
    advisoryLockAcquire: (...args) => advisoryLockAcquire(databaseAdapter, ...args),
    advisoryLockDeleteExpired: (...args) => advisoryLockDeleteExpired(databaseAdapter, ...args),
    advisoryLockRelease: (...args) => advisoryLockRelease(databaseAdapter, ...args),
    advisoryLockRenew: (...args) => advisoryLockRenew(databaseAdapter, ...args),
    authCreatePrincipal: (...args) => authCreatePrincipal(databaseAdapter, ...args),
    authCreateSession: (...args) => authCreateSession(databaseAdapter, ...args),
    authCreateSyncSessionForSubject: (...args) =>
      authCreateSyncSessionForSubject(databaseAdapter, ...args),
    authGetPrincipals: (...args) => authGetPrincipals(databaseAdapter, ...args),
    authGetPrincipalsTotalCount: (...args) => authGetPrincipalsTotalCount(databaseAdapter, ...args),
    disconnect: () => databaseAdapter.disconnect(),
    eventGetChangelogEvents: (...args) => eventGetChangelogEvents(databaseAdapter, ...args),
    eventGetChangelogEventsEntityInfo: (...args) =>
      eventGetChangelogEventsEntityInfo(databaseAdapter, ...args),
    eventGetChangelogEventsTotalCount: (...args) =>
      eventGetChangelogEventsTotalCount(databaseAdapter, ...args),
    managementDirtyGetNextEntity: (...args) =>
      managementDirtyGetNextEntity(databaseAdapter, ...args),
    managementDirtyMarkEntities: (...args) => managementDirtyMarkEntities(databaseAdapter, ...args),
    managementDirtyUpdateEntity: (...args) => managementDirtyUpdateEntity(databaseAdapter, ...args),
    managementOptimize: (...args) => managementOptimize(databaseAdapter, ...args),
    managementSyncGetEvents: (...args) => managementSyncGetEvents(databaseAdapter, ...args),
    managementSyncGetHeadEventId: (...args) =>
      managementSyncGetHeadEventId(databaseAdapter, ...args),
    publishedEntityGetOne: (...args) => publishedEntityGetOne(databaseAdapter, ...args),
    publishedEntityGetEntities: (...args) => publishedEntityGetEntities(databaseAdapter, ...args),
    publishedEntitySampleEntities: (...args) =>
      publishedEntitySampleEntities(databaseAdapter, ...args),
    publishedEntitySearchEntities: (...args) =>
      publishedEntitySearchEntities(databaseAdapter, ...args),
    publishedEntitySearchTotalCount: (...args) =>
      publishedEntitySearchTotalCount(databaseAdapter, ...args),
    schemaGetSpecification: (...args) => schemaGetSpecification(databaseAdapter, ...args),
    schemaUpdateCountEntitiesWithTypes: (...args) =>
      schemaUpdateCountEntitiesWithTypes(databaseAdapter, ...args),
    schemaUpdateDeleteComponentTypesFromIndexes: (...args) =>
      schemaUpdateDeleteComponentTypesFromIndexes(databaseAdapter, ...args),
    schemaUpdateModifyIndexes: (...args) => schemaUpdateModifyIndexes(databaseAdapter, ...args),
    schemaUpdateRenameTypes: (...args) => schemaUpdateRenameTypes(databaseAdapter, ...args),
    schemaUpdateSpecification: (...args) => schemaUpdateSpecification(databaseAdapter, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(databaseAdapter, ...args),
    withRootTransaction: (...args) => withRootTransaction(databaseAdapter, ...args),
  };
}
