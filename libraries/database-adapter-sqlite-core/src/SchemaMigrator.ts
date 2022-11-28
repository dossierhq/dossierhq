import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { Database, QueryOrQueryAndValues } from './QueryFunctions.js';
import { queryOne, queryRun } from './QueryFunctions.js';

/** Migrates the database to the latest version.
 *
 * The latest version is determined by `schemaVersionGenerator` returning null. The migration of
 * each version is run in a transaction.
 */
export async function migrate(
  database: Database,
  context: TransactionContext,
  schemaVersionGenerator: (version: number) => QueryOrQueryAndValues[] | null
): PromiseResult<void, typeof ErrorType.Generic> {
  const initialVersionResult = await queryOne<{ user_version: number }>(
    database,
    context,
    'PRAGMA user_version'
  );
  if (initialVersionResult.isError()) return initialVersionResult;
  const { user_version: initialVersion } = initialVersionResult.value;

  let version = initialVersion + 1;
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
  statements: QueryOrQueryAndValues[]
): PromiseResult<undefined, typeof ErrorType.Generic> {
  return context.withTransaction(async (context) => {
    const { logger } = context;
    logger.info(`Starting migration of database schema to version=${version}...`);
    for (const statement of statements) {
      const statementResult = await queryRun(database, context, statement);
      if (statementResult.isError()) return statementResult;
    }

    // PRAGMA can't use values, so create query manually. No SQL injection since we know it's a number
    if (typeof version !== 'number')
      return notOk.Generic(`version is for some reason nan (${version})`);
    const updateVersionResult = await queryRun(database, context, 'PRAGMA user_version=' + version);
    if (updateVersionResult.isError()) return updateVersionResult;
    logger.info(`Migrated database schema to version=${version}`);
    return ok(undefined);
  });
}
