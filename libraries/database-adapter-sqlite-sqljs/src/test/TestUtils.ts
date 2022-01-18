import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import { createSqliteDatabaseAdapter } from '@jonasb/datadata-database-adapter-sqlite-core';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { createSqlJsAdapter } from '..';

export async function createSqlJsTestAdapter(): PromiseResult<
  DatabaseAdapter,
  ErrorType.BadRequest | ErrorType.Generic
> {
  const adapter = await createSqlJsAdapter();
  return createSqliteDatabaseAdapter({ logger: NoOpLogger }, adapter);
}

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}
