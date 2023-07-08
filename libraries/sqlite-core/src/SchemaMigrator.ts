import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { Database, QueryOrQueryAndValues } from './QueryFunctions.js';
import { queryOne, queryRun } from './QueryFunctions.js';

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
  schemaVersionGenerator: (version: number) => QueryOrQueryAndValues[] | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  const initialVersionResult = await getCurrentSchemaVersion(database, context);
  if (initialVersionResult.isError()) return initialVersionResult;

  let version = initialVersionResult.value + 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const statements = schemaVersionGenerator(version);
    if (!statements) {
      return ok(undefined);
    }
    const migrateVersionResult = await migrateVersion(database, context, version, statements);
    if (migrateVersionResult.isError()) return migrateVersionResult;

    version += 1;
  }
}

async function migrateVersion(
  database: Database,
  context: TransactionContext,
  version: number,
  statements: QueryOrQueryAndValues[],
): PromiseResult<undefined, typeof ErrorType.Generic> {
  return context.withTransaction(async (context) => {
    const { logger } = context;
    logger.info(`Starting migration of database schema to version=${version}...`);
    for (const statement of statements) {
      const statementResult = await queryRun(database, context, statement);
      if (statementResult.isError()) return statementResult;
    }

    // PRAGMA can't use values, so create query manually. No SQL injection since we know it's a number
    if (typeof version !== 'number') {
      return notOk.Generic(`version is for some reason NaN (${version})`);
    }
    const updateVersionResult = await queryRun(database, context, 'PRAGMA user_version=' + version);
    if (updateVersionResult.isError()) return updateVersionResult;
    logger.info(`Migrated database schema to version=${version}`);
    return ok(undefined);
  });
}
