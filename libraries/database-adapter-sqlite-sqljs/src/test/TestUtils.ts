import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { createSqlJsAdapter } from '..';

export async function createSqlJsTestAdapter(): PromiseResult<
  DatabaseAdapter,
  ErrorType.BadRequest | ErrorType.Generic
> {
  return await createSqlJsAdapter({ logger: NoOpLogger });
}

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}
