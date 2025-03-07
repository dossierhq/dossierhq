import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import { queryOne, queryRun, type Database, type QueryOrQueryAndValues } from './QueryFunctions.js';

export interface SchemaVersionMigrationPlan {
  temporarilyDisableForeignKeys: boolean;
  queries: (QueryOrQueryAndValues | InteractiveMigrationQuery)[];
}

export type InteractiveMigrationQuery = (
  database: Database,
  context: TransactionContext,
) => PromiseResult<void, typeof ErrorType.Generic>;

export async function getCurrentSchemaVersion(
  database: Database,
  context: TransactionContext,
): PromiseResult<number, typeof ErrorType.Generic> {
  const result = await queryOne<{ user_version: number }>(database, context, 'PRAGMA user_version');
  if (result.isError()) return result;
  const { user_version: version } = result.value;
  return ok(version);
}

/** Migrates the database to the latest version.
 *
 * The latest version is determined by `schemaVersionGenerator` returning null. The migration of
 * each version is run in a transaction.
 */
export async function migrate(
  database: Database,
  context: TransactionContext,
  schemaVersionGenerator: (version: number) => SchemaVersionMigrationPlan | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const { logger } = context;
  const initialVersionResult = await getCurrentSchemaVersion(database, context);
  if (initialVersionResult.isError()) return initialVersionResult;
  const initialVersion = initialVersionResult.value;

  let version = initialVersion + 1;
  let done = false;
  while (!done) {
    const plan = schemaVersionGenerator(version);
    if (!plan) {
      done = true;
      break;
    }

    const migrateVersionResult = await migrateVersion(database, context, version, plan);
    if (migrateVersionResult.isError()) {
      logger.error(
        `Failed to migrate database schema to version=${version} (initial version=${initialVersion})`,
      );
      return migrateVersionResult;
    }

    version += 1;
  }

  if (version !== initialVersion + 1) {
    logger.info(
      `Finished migration of database schema from version ${initialVersion} to ${version - 1}`,
    );
  }
  return ok(undefined);
}

async function migrateVersion(
  database: Database,
  context: TransactionContext,
  version: number,
  plan: SchemaVersionMigrationPlan,
): PromiseResult<undefined, typeof ErrorType.Generic> {
  if (plan.temporarilyDisableForeignKeys) {
    const disableForeignKeysResult = await queryRun(database, context, 'PRAGMA foreign_keys=OFF');
    if (disableForeignKeysResult.isError()) return disableForeignKeysResult;
  }

  const transactionResult = await context.withTransaction<void, typeof ErrorType.Generic>(
    async (context) => {
      for (const query of plan.queries) {
        if (typeof query === 'function') {
          const queryResult = await query(database, context);
          if (queryResult.isError()) return queryResult;
        } else {
          const queryResult = await queryRun(database, context, query);
          if (queryResult.isError()) return queryResult;
        }
      }

      if (plan.temporarilyDisableForeignKeys) {
        const checkForeignKeysResult = await queryRun(
          database,
          context,
          'PRAGMA foreign_key_check',
        );
        if (checkForeignKeysResult.isError()) return checkForeignKeysResult;
      }

      // PRAGMA can't use values, so create query manually. No SQL injection since we know it's a number
      if (typeof version !== 'number') {
        return notOk.Generic(`version is for some reason NaN (${version})`);
      }
      const updateVersionResult = await queryRun(
        database,
        context,
        'PRAGMA user_version=' + version,
      );
      if (updateVersionResult.isError()) return updateVersionResult;
      return ok(undefined);
    },
  );
  if (transactionResult.isError()) return transactionResult;

  if (plan.temporarilyDisableForeignKeys) {
    const enableForeignKeysResult = await queryRun(database, context, 'PRAGMA foreign_keys=ON');
    if (enableForeignKeysResult.isError()) return enableForeignKeysResult;
  }

  return ok(undefined);
}
