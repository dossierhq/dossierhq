import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { createSqlite3Adapter } from '..';

export async function createSqlite3TestAdapter(
  filename: string | ':memory:',
  mode?: number
): PromiseResult<DatabaseAdapter, ErrorType.BadRequest | ErrorType.Generic> {
  return await createSqlite3Adapter({ logger: NoOpLogger }, filename, mode);
}

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}
