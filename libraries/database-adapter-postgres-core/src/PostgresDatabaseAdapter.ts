import type { DatabaseAdapter } from '@jonasb/datadata-server';
import type { PostgresTransaction } from '.';
import { adminEntityArchivingGetEntityInfo } from './admin-entity/archivingGetEntityInfo';
import { adminCreateEntity } from './admin-entity/createEntity';
import { adminEntityPublishingCreateEvents } from './admin-entity/createPublishingEvents';
import { adminEntityGetMultiple } from './admin-entity/getEntities';
import { adminGetEntity } from './admin-entity/getEntity';
import { adminEntityGetEntityName } from './admin-entity/getEntityName';
import { adminEntitySearchTotalCount } from './admin-entity/getTotalCount';
import {
  adminEntityPublishGetUnpublishedReferencedEntities,
  adminEntityPublishGetVersionInfo,
  adminEntityPublishUpdateEntity,
} from './admin-entity/publishEntities';
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
import { authCreateSession } from './auth/createSession';
import { withNestedTransaction, withRootTransaction } from './PostgresTransaction';
import { publishedEntityGetEntities } from './published-entity/getEntities';
import { publishedEntityGetOne } from './published-entity/getEntity';
import { publishedEntitySearchTotalCount } from './published-entity/getTotalCount';
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
    adminEntityPublishGetUnpublishedReferencedEntities: (...args) =>
      adminEntityPublishGetUnpublishedReferencedEntities(databaseAdapter, ...args),
    adminEntityPublishGetVersionInfo: (...args) =>
      adminEntityPublishGetVersionInfo(databaseAdapter, ...args),
    adminEntityPublishingCreateEvents: (...args) =>
      adminEntityPublishingCreateEvents(databaseAdapter, ...args),
    adminEntityPublishUpdateEntity: (...args) =>
      adminEntityPublishUpdateEntity(databaseAdapter, ...args),
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
    authCreateSession: (...args) => authCreateSession(databaseAdapter, ...args),
    disconnect: databaseAdapter.disconnect,
    publishedEntityGetOne: (...args) => publishedEntityGetOne(databaseAdapter, ...args),
    publishedEntityGetEntities: (...args) => publishedEntityGetEntities(databaseAdapter, ...args),
    publishedEntitySearchTotalCount: (...args) =>
      publishedEntitySearchTotalCount(databaseAdapter, ...args),
    queryLegacy: databaseAdapter.query,
    schemaGetSpecification: (...args) => schemaGetSpecification(databaseAdapter, ...args),
    schemaUpdateSpecification: (...args) => schemaUpdateSpecification(databaseAdapter, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(databaseAdapter, ...args),
    withRootTransaction: (...args) => withRootTransaction(databaseAdapter, ...args),
  };
}
