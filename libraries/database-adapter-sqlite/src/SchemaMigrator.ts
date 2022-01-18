import type { ErrorType, Logger, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from '.';
import type { QueryOrQueryAndValues } from './QueryFunctions';
import { queryNone, queryOne } from './QueryFunctions';

class MigrationContext extends TransactionContextImpl<MigrationContext> {
  constructor(databaseAdapter: DatabaseAdapter, logger: Logger, transaction: Transaction | null) {
    super(databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): MigrationContext {
    return new MigrationContext(databaseAdapter, this.logger, transaction);
  }
}

export function createMigrationContext(
  databaseAdapter: DatabaseAdapter,
  logger: Logger
): TransactionContext {
  return new MigrationContext(databaseAdapter, logger, null);
}

/** Migrates the database to the latest version.
 *
 * The latest version is determined by `schemaVersionGenerator` returning null. The migration of
 * each version is run in a transaction.
 */
export async function migrate(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  schemaVersionGenerator: (version: number) => QueryOrQueryAndValues[] | null
): PromiseResult<void, ErrorType.Generic> {
  const initialVersionResult = await queryOne<{ user_version: number }>(
    databaseAdapter,
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
    const migrateVersionResult = await migrateVersion(
      databaseAdapter,
      context,
      version,
      statements
    );
    if (migrateVersionResult.isError()) return migrateVersionResult;

    version += 1;
  }
}

async function migrateVersion(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  version: number,
  statements: QueryOrQueryAndValues[]
): PromiseResult<undefined, ErrorType.Generic> {
  return context.withTransaction(async (context) => {
    const { logger } = context;
    logger.info(`Starting migration of database schema to version=${version}...`);
    for (const statement of statements) {
      const statementResult = await queryNone(databaseAdapter, context, statement);
      if (statementResult.isError()) return statementResult;
    }

    // PRAGMA can't use values, so create query manually. No SQL injection since we know it's a number
    if (typeof version !== 'number')
      return notOk.Generic(`version is for some reason nan (${version})`);
    const updateVersionResult = await queryNone(
      databaseAdapter,
      context,
      'PRAGMA user_version=' + version
    );
    if (updateVersionResult.isError()) return updateVersionResult;
    logger.info(`Migrated database schema to version=${version}`);
    return ok(undefined);
  });
}
