import type { Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type { DatabaseAdapter, TransactionContext } from '..';

interface MockDatabaseAdapter extends DatabaseAdapter {
  authCreateSession: jest.MockedFunction<DatabaseAdapter['authCreateSession']>;
  schemaGetSpecification: jest.MockedFunction<DatabaseAdapter['schemaGetSpecification']>;
  schemaUpdateSpecification: jest.MockedFunction<DatabaseAdapter['schemaUpdateSpecification']>;
  queryLegacy: jest.MockedFunction<DatabaseAdapter['queryLegacy']>;
}

export function createMockTransactionContext(logger: Logger | null = null): TransactionContext {
  const resolvedLogger = logger || NoOpLogger;
  const context: TransactionContext = {
    get logger() {
      return resolvedLogger;
    },
    get transaction() {
      return null;
    },
    withTransaction: jest.fn(),
  };
  return context;
}

export function createMockDatabaseAdapter(): MockDatabaseAdapter {
  const adapter: MockDatabaseAdapter = {
    disconnect: jest.fn(),
    authCreateSession: jest.fn(),
    schemaGetSpecification: jest.fn(),
    schemaUpdateSpecification: jest.fn(),
    queryLegacy: jest.fn(),
    withRootTransaction: jest.fn(),
    withNestedTransaction: jest.fn(),
    isUniqueViolationOfConstraint: jest.fn(),
  };
  return adapter;
}

export function getDatabaseAdapterMockedCallsWithoutContextAndUnordered(
  databaseAdapter: MockDatabaseAdapter
): Array<unknown[]> {
  const calls: Array<unknown[]> = [];
  const mocksWithInitialContextArg: (keyof MockDatabaseAdapter)[] = [
    'authCreateSession',
    'schemaGetSpecification',
  ];
  for (const methodName of mocksWithInitialContextArg) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const args of (databaseAdapter[methodName] as jest.MockedFunction<any>).mock.calls) {
      calls.push([methodName, ...args.slice(1)]);
    }
  }
  return calls;
}
