import type { DatabaseAdapter, DatabaseOptimizationOptions } from '@dossierhq/database-adapter';
import type { PostgresTransaction } from './PostgresTransaction.js';
import { withNestedTransaction, withRootTransaction } from './PostgresTransaction.js';
import { adminEntityArchivingGetEntityInfo } from './admin-entity/archivingGetEntityInfo.js';
import { adminCreateEntity } from './admin-entity/createEntity.js';
import { adminEntityPublishingCreateEvents } from './admin-entity/createPublishingEvents.js';
import { adminEntityGetMultiple } from './admin-entity/getEntities.js';
import { adminGetEntity } from './admin-entity/getEntity.js';
import {
  adminEntityHistoryGetEntityInfo,
  adminEntityHistoryGetVersionsInfo,
} from './admin-entity/getEntityHistory.js';
import { adminEntityGetEntityName } from './admin-entity/getEntityName.js';
import {
  adminEntityPublishingHistoryGetEntityInfo,
  adminEntityPublishingHistoryGetEvents,
} from './admin-entity/getPublishingHistory.js';
import { adminEntityGetReferenceEntitiesInfo } from './admin-entity/getReferenceEntitiesInfo.js';
import { adminEntitySearchTotalCount } from './admin-entity/getTotalCount.js';
import {
  adminEntityPublishGetVersionInfo,
  adminEntityPublishUpdateEntity,
  adminEntityPublishUpdatePublishedReferencesIndex,
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
import { authCreateSession } from './auth/createSession.js';
import { managementOptimize } from './management/optimize.js';
import { publishedEntityGetEntities } from './published-entity/getEntities.js';
import { publishedEntityGetOne } from './published-entity/getEntity.js';
import { publishedEntitySearchTotalCount } from './published-entity/getTotalCount.js';
import { publishedEntitySampleEntities } from './published-entity/sampleEntities.js';
import { publishedEntitySearchEntities } from './published-entity/searchEntities.js';
import { schemaGetSpecification } from './schema/getSpecification.js';
import { schemaUpdateSpecification } from './schema/updateSpecification.js';

export type PostgresDatabaseOptimizationOptions = DatabaseOptimizationOptions;

export interface PostgresDatabaseAdapter {
  disconnect(): Promise<void>;

  createTransaction(): Promise<PostgresTransaction>;

  query<R>(
    transaction: PostgresTransaction | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;

  base64Encode(value: string): string;
  base64Decode(value: string): string;
}

export function createPostgresDatabaseAdapterAdapter(
  databaseAdapter: PostgresDatabaseAdapter
): DatabaseAdapter<PostgresDatabaseOptimizationOptions> {
  return {
    adminEntityArchivingGetEntityInfo: (...args) =>
      adminEntityArchivingGetEntityInfo(databaseAdapter, ...args),
    adminEntityCreate: (...args) => adminCreateEntity(databaseAdapter, ...args),
    adminEntityGetOne: (...args) => adminGetEntity(databaseAdapter, ...args),
    adminEntityGetMultiple: (...args) => adminEntityGetMultiple(databaseAdapter, ...args),
    adminEntityGetEntityName: (...args) => adminEntityGetEntityName(databaseAdapter, ...args),
    adminEntityGetReferenceEntitiesInfo: (...args) =>
      adminEntityGetReferenceEntitiesInfo(databaseAdapter, ...args),
    adminEntityHistoryGetEntityInfo: (...args) =>
      adminEntityHistoryGetEntityInfo(databaseAdapter, ...args),
    adminEntityHistoryGetVersionsInfo: (...args) =>
      adminEntityHistoryGetVersionsInfo(databaseAdapter, ...args),
    adminEntityPublishGetVersionInfo: (...args) =>
      adminEntityPublishGetVersionInfo(databaseAdapter, ...args),
    adminEntityPublishingCreateEvents: (...args) =>
      adminEntityPublishingCreateEvents(databaseAdapter, ...args),
    adminEntityPublishingHistoryGetEntityInfo: (...args) =>
      adminEntityPublishingHistoryGetEntityInfo(databaseAdapter, ...args),
    adminEntityPublishingHistoryGetEvents: (...args) =>
      adminEntityPublishingHistoryGetEvents(databaseAdapter, ...args),
    adminEntityPublishUpdateEntity: (...args) =>
      adminEntityPublishUpdateEntity(databaseAdapter, ...args),
    adminEntityPublishUpdatePublishedReferencesIndex: (...args) =>
      adminEntityPublishUpdatePublishedReferencesIndex(databaseAdapter, ...args),
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
    authCreateSession: (...args) => authCreateSession(databaseAdapter, ...args),
    disconnect: databaseAdapter.disconnect,
    managementOptimize: (...args) => managementOptimize(databaseAdapter, ...args),
    publishedEntityGetOne: (...args) => publishedEntityGetOne(databaseAdapter, ...args),
    publishedEntityGetEntities: (...args) => publishedEntityGetEntities(databaseAdapter, ...args),
    publishedEntitySampleEntities: (...args) =>
      publishedEntitySampleEntities(databaseAdapter, ...args),
    publishedEntitySearchEntities: (...args) =>
      publishedEntitySearchEntities(databaseAdapter, ...args),
    publishedEntitySearchTotalCount: (...args) =>
      publishedEntitySearchTotalCount(databaseAdapter, ...args),
    schemaGetSpecification: (...args) => schemaGetSpecification(databaseAdapter, ...args),
    schemaUpdateSpecification: (...args) => schemaUpdateSpecification(databaseAdapter, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(databaseAdapter, ...args),
    withRootTransaction: (...args) => withRootTransaction(databaseAdapter, ...args),
  };
}
