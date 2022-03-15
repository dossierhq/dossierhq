import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { PostgresTransaction } from '.';
import { adminEntityArchivingGetEntityInfo } from './admin-entity/archivingGetEntityInfo';
import { adminCreateEntity } from './admin-entity/createEntity';
import { adminEntityPublishingCreateEvents } from './admin-entity/createPublishingEvents';
import { adminEntityGetMultiple } from './admin-entity/getEntities';
import { adminGetEntity } from './admin-entity/getEntity';
import {
  adminEntityHistoryGetEntityInfo,
  adminEntityHistoryGetVersionsInfo,
} from './admin-entity/getEntityHistory';
import { adminEntityGetEntityName } from './admin-entity/getEntityName';
import {
  adminEntityPublishingHistoryGetEntityInfo,
  adminEntityPublishingHistoryGetEvents,
} from './admin-entity/getPublishingHistory';
import { adminEntityGetReferenceEntitiesInfo } from './admin-entity/getReferenceEntitiesInfo';
import { adminEntitySearchTotalCount } from './admin-entity/getTotalCount';
import {
  adminEntityPublishGetUnpublishedReferencedEntities,
  adminEntityPublishGetVersionInfo,
  adminEntityPublishUpdateEntity,
} from './admin-entity/publishEntities';
import { adminEntitySampleEntities } from './admin-entity/sampleEntities';
import { adminEntitySearchEntities } from './admin-entity/searchEntities';
import {
  adminEntityUnpublishEntities,
  adminEntityUnpublishGetEntitiesInfo,
  adminEntityUnpublishGetPublishedReferencedEntities,
} from './admin-entity/unpublishEntities';
import {
  adminEntityUpdateEntity,
  adminEntityUpdateGetEntityInfo,
} from './admin-entity/updateEntity';
import { adminEntityUpdateStatus } from './admin-entity/updateStatus';
import { advisoryLockAcquire } from './advisory-lock/advisoryLockAcquire';
import { advisoryLockDeleteExpired } from './advisory-lock/advisoryLockDeleteExpired';
import { advisoryLockRelease } from './advisory-lock/advisoryLockRelease';
import { advisoryLockRenew } from './advisory-lock/advisoryLockRenew';
import { authCreateSession } from './auth/createSession';
import { withNestedTransaction, withRootTransaction } from './PostgresTransaction';
import { publishedEntityGetEntities } from './published-entity/getEntities';
import { publishedEntityGetOne } from './published-entity/getEntity';
import { publishedEntitySearchTotalCount } from './published-entity/getTotalCount';
import { publishedEntitySampleEntities } from './published-entity/sampleEntities';
import { publishedEntitySearchEntities } from './published-entity/searchEntities';
import { schemaGetSpecification } from './schema/getSpecification';
import { schemaUpdateSpecification } from './schema/updateSpecification';

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
): DatabaseAdapter {
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
    adminEntityPublishGetUnpublishedReferencedEntities: (...args) =>
      adminEntityPublishGetUnpublishedReferencedEntities(databaseAdapter, ...args),
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
    adminEntitySampleEntities: (...args) => adminEntitySampleEntities(databaseAdapter, ...args),
    adminEntitySearchEntities: (...args) => adminEntitySearchEntities(databaseAdapter, ...args),
    adminEntitySearchTotalCount: (...args) => adminEntitySearchTotalCount(databaseAdapter, ...args),
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
