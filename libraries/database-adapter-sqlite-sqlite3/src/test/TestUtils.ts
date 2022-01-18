import type { ErrorType, Logger, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import { createSqliteDatabaseAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { createSqlite3Adapter } from '..';

class DummyContextImpl extends TransactionContextImpl<TransactionContext> {
  constructor(databaseAdapter: DatabaseAdapter, logger: Logger, transaction: Transaction | null) {
    super(databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): TransactionContext {
    return new DummyContextImpl(databaseAdapter, this.logger, transaction);
  }
}

export async function createSqlite3TestAdapter(
  filename: string | ':memory:',
  mode?: number
): PromiseResult<DatabaseAdapter, ErrorType.BadRequest | ErrorType.Generic> {
  const adapter = await createSqlite3Adapter(filename, mode);
  return createSqliteDatabaseAdapter({ logger: NoOpLogger }, adapter);
}

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}

export async function createMockContext(
  adapter: SqliteDatabaseAdapter
): PromiseResult<TransactionContext, ErrorType.BadRequest | ErrorType.Generic> {
  const result = await createSqliteDatabaseAdapter({ logger: NoOpLogger }, adapter);
  if (result.isError()) {
    return result;
  }
  const databaseAdapter = result.value;
  return ok(new DummyContextImpl(databaseAdapter, NoOpLogger, null));
}
