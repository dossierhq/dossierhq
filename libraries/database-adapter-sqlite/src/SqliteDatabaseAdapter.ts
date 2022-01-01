import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { Context, DatabaseAdapter } from '@jonasb/datadata-server';
import type { UniqueConstraint } from '.';
import { adminCreateEntity } from './admin-entity/createEntity';
import { adminEntityPublishingCreateEvents } from './admin-entity/createPublishingEvents';
import { adminGetEntity } from './admin-entity/getEntity';
import { adminEntityGetEntityName } from './admin-entity/getEntityName';
import {
  adminEntityPublishGetUnpublishedReferencedEntities,
  adminEntityPublishGetVersionInfo,
  adminEntityPublishUpdateEntity,
} from './admin-entity/publishEntities';
import {
  adminEntityUnpublishEntities,
  adminEntityUnpublishGetEntitiesInfo,
  adminEntityUnpublishGetPublishedReferencedEntities,
} from './admin-entity/unpublishEntities';
import {
  adminEntityUpdateEntity,
  adminEntityUpdateGetEntityInfo,
} from './admin-entity/updateEntity';
import { authCreateSession } from './auth/createSession';
import { queryOne } from './QueryFunctions';
import { schemaGetSpecification } from './schema/getSpecification';
import { schemaUpdateSpecification } from './schema/updateSpecification';
import { isSemVerEqualOrGreaterThan, parseSemVer } from './SemVer';
import { withNestedTransaction, withRootTransaction } from './SqliteTransaction';

export type ColumnValue = number | string | Uint8Array | null;

const minimumSupportedVersion = { major: 3, minor: 35, patch: 0 };

export interface SqliteDatabaseAdapter {
  disconnect(): Promise<void>;
  query<R>(query: string, values: ColumnValue[] | undefined): Promise<R[]>;
  isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean;
}

export async function createSqliteDatabaseAdapter(
  context: Context,
  sqliteAdapter: SqliteDatabaseAdapter
): PromiseResult<DatabaseAdapter, ErrorType.BadRequest | ErrorType.Generic> {
  const validityResult = await checkAdapterValidity(context, sqliteAdapter);
  if (validityResult.isError()) {
    return validityResult;
  }

  const adapter: DatabaseAdapter = {
    adminEntityCreate: (...args) => adminCreateEntity(sqliteAdapter, ...args),
    adminEntityGetOne: (...args) => adminGetEntity(sqliteAdapter, ...args),
    adminEntityGetEntityName: (...args) => adminEntityGetEntityName(sqliteAdapter, ...args),
    adminEntityPublishGetUnpublishedReferencedEntities: (...args) =>
      adminEntityPublishGetUnpublishedReferencedEntities(sqliteAdapter, ...args),
    adminEntityPublishGetVersionInfo: (...args) =>
      adminEntityPublishGetVersionInfo(sqliteAdapter, ...args),
    adminEntityPublishingCreateEvents: (...args) =>
      adminEntityPublishingCreateEvents(sqliteAdapter, ...args),
    adminEntityPublishUpdateEntity: (...args) =>
      adminEntityPublishUpdateEntity(sqliteAdapter, ...args),
    adminEntityUpdateEntity: (...args) => adminEntityUpdateEntity(sqliteAdapter, ...args),
    adminEntityUpdateGetEntityInfo: (...args) =>
      adminEntityUpdateGetEntityInfo(sqliteAdapter, ...args),
    adminEntityUnpublishGetEntitiesInfo: (...args) =>
      adminEntityUnpublishGetEntitiesInfo(sqliteAdapter, ...args),
    adminEntityUnpublishEntities: (...args) => adminEntityUnpublishEntities(sqliteAdapter, ...args),
    adminEntityUnpublishGetPublishedReferencedEntities: (...args) =>
      adminEntityUnpublishGetPublishedReferencedEntities(sqliteAdapter, ...args),
    authCreateSession: (...args) => authCreateSession(sqliteAdapter, ...args),
    disconnect: sqliteAdapter.disconnect,
    queryLegacy: () => {
      throw new Error('TODO');
    },
    schemaGetSpecification: (...args) => schemaGetSpecification(sqliteAdapter, ...args),
    schemaUpdateSpecification: (...args) => schemaUpdateSpecification(sqliteAdapter, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(sqliteAdapter, ...args),
    withRootTransaction: (...args) => withRootTransaction(sqliteAdapter, ...args),
  };
  return ok(adapter);
}

async function checkAdapterValidity(
  context: Context,
  adapter: SqliteDatabaseAdapter
): PromiseResult<void, ErrorType.Generic | ErrorType.BadRequest> {
  const result = await queryOne<{ version: string }>(
    adapter,
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
