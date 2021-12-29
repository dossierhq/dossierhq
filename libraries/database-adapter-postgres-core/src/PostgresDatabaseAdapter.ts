import type { DatabaseAdapter } from '@jonasb/datadata-server';
import type { PostgresTransaction } from '.';
import { adminCreateEntity } from './admin-entity/createEntity';
import { adminEntityPublishingCreateEvents } from './admin-entity/createPublishingEvents';
import { adminGetEntity } from './admin-entity/getEntity';
import {
  adminEntityPublishGetUnpublishedReferencedEntities,
  adminEntityPublishGetVersionInfo,
  adminEntityPublishUpdateEntity,
} from './admin-entity/publishEntities';
import { authCreateSession } from './auth/createSession';
import { withNestedTransaction, withRootTransaction } from './PostgresTransaction';
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
    adminEntityCreate: (...args) => adminCreateEntity(databaseAdapter, ...args),
    adminEntityGetOne: (...args) => adminGetEntity(databaseAdapter, ...args),
    adminEntityPublishGetUnpublishedReferencedEntities: (...args) =>
      adminEntityPublishGetUnpublishedReferencedEntities(databaseAdapter, ...args),
    adminEntityPublishGetVersionInfo: (...args) =>
      adminEntityPublishGetVersionInfo(databaseAdapter, ...args),
    adminEntityPublishingCreateEvents: (...args) =>
      adminEntityPublishingCreateEvents(databaseAdapter, ...args),
    adminEntityPublishUpdateEntity: (...args) =>
      adminEntityPublishUpdateEntity(databaseAdapter, ...args),
    authCreateSession: (...args) => authCreateSession(databaseAdapter, ...args),
    disconnect: databaseAdapter.disconnect,
    isUniqueViolationOfConstraint: databaseAdapter.isUniqueViolationOfConstraint,
    queryLegacy: databaseAdapter.query,
    schemaGetSpecification: (...args) => schemaGetSpecification(databaseAdapter, ...args),
    schemaUpdateSpecification: (...args) => schemaUpdateSpecification(databaseAdapter, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(databaseAdapter, ...args),
    withRootTransaction: (...args) => withRootTransaction(databaseAdapter, ...args),
  };
}
