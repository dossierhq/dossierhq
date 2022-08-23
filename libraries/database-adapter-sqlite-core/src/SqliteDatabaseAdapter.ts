import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  Context,
  DatabaseAdapter,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
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
import type { UniqueConstraint } from './DatabaseSchema.js';
import { createInitializationContext } from './InitializationContext.js';
import { publishedEntityGetEntities } from './published-entity/getEntities.js';
import { publishedEntityGetOne } from './published-entity/getEntity.js';
import { publishedEntitySearchTotalCount } from './published-entity/getTotalCount.js';
import { publishedEntitySampleEntities } from './published-entity/sampleEntities.js';
import { publishedEntitySearchEntities } from './published-entity/searchEntities.js';
import type { Database } from './QueryFunctions.js';
import { queryOne } from './QueryFunctions.js';
import { schemaGetSpecification } from './schema/getSpecification.js';
import { schemaUpdateSpecification } from './schema/updateSpecification.js';
import { migrateDatabaseIfNecessary } from './SchemaDefinition.js';
import { isSemVerEqualOrGreaterThan, parseSemVer } from './SemVer.js';
import { withNestedTransaction, withRootTransaction } from './SqliteTransaction.js';
import { Mutex } from './utils/MutexUtils.js';

export type ColumnValue = number | string | Uint8Array | null;

// For https://www.sqlite.org/stricttables.html
const minimumSupportedVersion = { major: 3, minor: 37, patch: 0 };

export interface SqliteDatabaseAdapter {
  disconnect(): Promise<void>;
  query<R>(query: string, values: ColumnValue[] | undefined): Promise<R[]>;
  isFtsVirtualTableConstraintFailed(error: unknown): boolean;
  isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean;
  encodeCursor(value: string): string;
  decodeCursor(value: string): string;
}

export async function createSqliteDatabaseAdapterAdapter(
  context: Context,
  sqliteAdapter: SqliteDatabaseAdapter
): PromiseResult<DatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const database: Database = { mutex: new Mutex(), adapter: sqliteAdapter };

  const outerAdapter = createOuterAdapter(database);
  const initializationContext = createInitializationContext(outerAdapter, context.logger);

  const validityResult = await checkAdapterValidity(database, initializationContext);
  if (validityResult.isError()) return validityResult;

  const migrationResult = await migrateDatabaseIfNecessary(database, initializationContext);
  if (migrationResult.isError()) return migrationResult;

  return ok(outerAdapter);
}

function createOuterAdapter(database: Database): DatabaseAdapter {
  return {
    adminEntityArchivingGetEntityInfo: (...args) =>
      adminEntityArchivingGetEntityInfo(database, ...args),
    adminEntityCreate: (...args) => adminCreateEntity(database, ...args),
    adminEntityGetOne: (...args) => adminGetEntity(database, ...args),
    adminEntityGetMultiple: (...args) => adminEntityGetMultiple(database, ...args),
    adminEntityGetEntityName: (...args) => adminEntityGetEntityName(database, ...args),
    adminEntityGetReferenceEntitiesInfo: (...args) =>
      adminEntityGetReferenceEntitiesInfo(database, ...args),
    adminEntityHistoryGetEntityInfo: (...args) =>
      adminEntityHistoryGetEntityInfo(database, ...args),
    adminEntityHistoryGetVersionsInfo: (...args) =>
      adminEntityHistoryGetVersionsInfo(database, ...args),
    adminEntityPublishUpdatePublishedReferencesIndex: (...args) =>
      adminEntityPublishUpdatePublishedReferencesIndex(database, ...args),
    adminEntityPublishGetVersionInfo: (...args) =>
      adminEntityPublishGetVersionInfo(database, ...args),
    adminEntityPublishingCreateEvents: (...args) =>
      adminEntityPublishingCreateEvents(database, ...args),
    adminEntityPublishingHistoryGetEntityInfo: (...args) =>
      adminEntityPublishingHistoryGetEntityInfo(database, ...args),
    adminEntityPublishingHistoryGetEvents: (...args) =>
      adminEntityPublishingHistoryGetEvents(database, ...args),
    adminEntityPublishUpdateEntity: (...args) => adminEntityPublishUpdateEntity(database, ...args),
    adminEntitySampleEntities: (...args) => adminEntitySampleEntities(database, ...args),
    adminEntitySearchEntities: (...args) => adminEntitySearchEntities(database, ...args),
    adminEntitySearchTotalCount: (...args) => adminEntitySearchTotalCount(database, ...args),
    adminEntityUpdateEntity: (...args) => adminEntityUpdateEntity(database, ...args),
    adminEntityUpdateGetEntityInfo: (...args) => adminEntityUpdateGetEntityInfo(database, ...args),
    adminEntityUpdateStatus: (...args) => adminEntityUpdateStatus(database, ...args),
    adminEntityUnpublishGetEntitiesInfo: (...args) =>
      adminEntityUnpublishGetEntitiesInfo(database, ...args),
    adminEntityUnpublishEntities: (...args) => adminEntityUnpublishEntities(database, ...args),
    adminEntityUnpublishGetPublishedReferencedEntities: (...args) =>
      adminEntityUnpublishGetPublishedReferencedEntities(database, ...args),
    advisoryLockAcquire: (...args) => advisoryLockAcquire(database, ...args),
    advisoryLockDeleteExpired: (...args) => advisoryLockDeleteExpired(database, ...args),
    advisoryLockRelease: (...args) => advisoryLockRelease(database, ...args),
    advisoryLockRenew: (...args) => advisoryLockRenew(database, ...args),
    authCreateSession: (...args) => authCreateSession(database, ...args),
    disconnect: database.adapter.disconnect,
    publishedEntityGetOne: (...args) => publishedEntityGetOne(database, ...args),
    publishedEntityGetEntities: (...args) => publishedEntityGetEntities(database, ...args),
    publishedEntitySampleEntities: (...args) => publishedEntitySampleEntities(database, ...args),
    publishedEntitySearchEntities: (...args) => publishedEntitySearchEntities(database, ...args),
    publishedEntitySearchTotalCount: (...args) =>
      publishedEntitySearchTotalCount(database, ...args),
    schemaGetSpecification: (...args) => schemaGetSpecification(database, ...args),
    schemaUpdateSpecification: (...args) => schemaUpdateSpecification(database, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(database, ...args),
    withRootTransaction: (...args) => withRootTransaction(database, ...args),
  };
}

async function checkAdapterValidity(
  database: Database,
  context: TransactionContext
): PromiseResult<void, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  const result = await queryOne<{ version: string }>(
    database,
    context,
    'SELECT sqlite_version() AS version',
    undefined
  );
  if (result.isError()) {
    return result;
  }
  const { version } = result.value;
  const isSupported = isSemVerEqualOrGreaterThan(parseSemVer(version), minimumSupportedVersion);
  if (!isSupported) {
    return notOk.BadRequest(
      `Database is using sqlite ${version}, (${minimumSupportedVersion.major}.${minimumSupportedVersion.minor}.${minimumSupportedVersion.patch}+ required)`
    );
  }
  return ok(undefined);
}
