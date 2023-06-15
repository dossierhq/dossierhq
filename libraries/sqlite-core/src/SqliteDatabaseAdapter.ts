import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  Context,
  DatabaseAdapter,
  DatabaseOptimizationOptions,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { UniqueConstraint } from './DatabaseSchema.js';
import { createInitializationContext } from './InitializationContext.js';
import type { Database } from './QueryFunctions.js';
import { queryOne, queryRun } from './QueryFunctions.js';
import { checkMigrationStatus, migrateDatabaseIfNecessary } from './SchemaDefinition.js';
import { isSemVerEqualOrGreaterThan, parseSemVer } from './SemVer.js';
import { withNestedTransaction, withRootTransaction } from './SqliteTransaction.js';
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
import { adminEntityIndexesUpdateLatest } from './admin-entity/indexesUpdateLatest.js';
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
import { managementDirtyGetNextEntity } from './management/dirtyGetNextEntity.js';
import { managementDirtyMarkEntities } from './management/dirtyMarkEntities.js';
import { managementDirtyUpdateEntity } from './management/dirtyUpdateEntity.js';
import { managementDirtyUpdatePublishedIndexes } from './management/dirtyUpdatePublishedIndexes.js';
import { managementOptimize } from './management/optimize.js';
import { publishedEntityGetEntities } from './published-entity/getEntities.js';
import { publishedEntityGetOne } from './published-entity/getEntity.js';
import { publishedEntitySearchTotalCount } from './published-entity/getTotalCount.js';
import { publishedEntitySampleEntities } from './published-entity/sampleEntities.js';
import { publishedEntitySearchEntities } from './published-entity/searchEntities.js';
import { schemaGetSpecification } from './schema/getSpecification.js';
import { schemaUpdateSpecification } from './schema/updateSpecification.js';
import { Mutex } from './utils/MutexUtils.js';

export type ColumnValue = number | string | Uint8Array | null;

// For https://www.sqlite.org/stricttables.html
const minimumSupportedVersion = { major: 3, minor: 37, patch: 0 };

const supportedJournalModes = ['wal', 'delete', 'memory'] as const;

export interface SqliteDatabaseAdapter {
  disconnect(): Promise<void>;
  query<R>(query: string, values: ColumnValue[] | undefined): Promise<R[]>;
  run(query: string, values: ColumnValue[] | undefined): Promise<number>;
  isFtsVirtualTableConstraintFailed(error: unknown): boolean;
  isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean;
  encodeCursor(value: string): string;
  decodeCursor(value: string): string;
  randomUUID(): string;
}

export type SqliteDatabaseOptions = (
  | { migrate: false }
  | ({ migrate: true } & SqliteDatabaseMigrationOptions)
) & { journalMode?: (typeof supportedJournalModes)[number] };

export interface SqliteDatabaseMigrationOptions {
  fts: {
    version: 'fts4' | 'fts5';
    /** The tokenizer used for FTS.
     * https://www.sqlite.org/fts3.html#tokenizer or https://www.sqlite.org/fts5.html#tokenizers*/
    tokenizer?: string;
  };
}

export interface SqliteDatabaseOptimizationOptions extends DatabaseOptimizationOptions {
  fullTextSearchAdmin?: boolean;
  fullTextSearchPublished?: boolean;
}

export async function createSqliteDatabaseAdapterAdapter(
  context: Context,
  sqliteAdapter: SqliteDatabaseAdapter,
  options: SqliteDatabaseOptions
): PromiseResult<
  DatabaseAdapter<SqliteDatabaseOptimizationOptions>,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const database: Database = { mutex: new Mutex(), adapter: sqliteAdapter };

  const outerAdapter = createOuterAdapter(database);
  const initializationContext = createInitializationContext(outerAdapter, context.logger, null);

  const validityResult = await checkAdapterValidity(database, initializationContext);
  if (validityResult.isError()) return validityResult;

  if (options.migrate) {
    const migrationResult = await migrateDatabaseIfNecessary(
      database,
      initializationContext,
      options
    );
    if (migrationResult.isError()) return migrationResult;
  } else {
    const migrationResult = await checkMigrationStatus(database, initializationContext);
    if (migrationResult.isError()) return migrationResult;
  }

  if (options.journalMode) {
    const journalModeResult = await setJournalMode(
      database,
      initializationContext,
      options.journalMode
    );
    if (journalModeResult.isError()) return journalModeResult;
  }

  return ok(outerAdapter);
}

async function setJournalMode(
  database: Database,
  context: TransactionContext,
  journalMode: (typeof supportedJournalModes)[number]
): PromiseResult<void, typeof ErrorType.Generic> {
  if (!supportedJournalModes.includes(journalMode)) {
    return notOk.Generic(`Unsupported journal mode (${journalMode})`);
  }
  // journalMode is safe to use here because we check it above
  const result = await queryRun(
    database,
    context,
    `PRAGMA journal_mode = ${journalMode}`,
    undefined
  );
  return result.isOk() ? ok(undefined) : result;
}

function createOuterAdapter(
  database: Database
): DatabaseAdapter<SqliteDatabaseOptimizationOptions> {
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
    adminEntityIndexesUpdateLatest: (...args) => adminEntityIndexesUpdateLatest(database, ...args),
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
    adminEntityUniqueIndexGetValues: (...args) =>
      adminEntityUniqueIndexGetValues(database, ...args),
    adminEntityUniqueIndexUpdateValues: (...args) =>
      adminEntityUniqueIndexUpdateValues(database, ...args),
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
    managementDirtyMarkEntities: (...args) => managementDirtyMarkEntities(database, ...args),
    managementOptimize: (...args) => managementOptimize(database, ...args),
    managementDirtyGetNextEntity: (...args) => managementDirtyGetNextEntity(database, ...args),
    managementDirtyUpdateEntity: (...args) => managementDirtyUpdateEntity(database, ...args),
    managementDirtyUpdatePublishedIndexes: (...args) =>
      managementDirtyUpdatePublishedIndexes(database, ...args),
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
