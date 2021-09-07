import type { Logger, SchemaSpecification } from '@jonasb/datadata-core';
import { Schema } from '@jonasb/datadata-core';
import type { DatabaseAdapter, SessionContext, TransactionContext } from '..';
import type { AuthContext } from '../Context';

interface MockDatabaseAdapter extends DatabaseAdapter {
  authCreatePrincipal: jest.MockedFunction<DatabaseAdapter['authCreatePrincipal']>;
  authCreateSession: jest.MockedFunction<DatabaseAdapter['authCreateSession']>;
  schemaGetSpecification: jest.MockedFunction<DatabaseAdapter['schemaGetSpecification']>;
  queryLegacy: jest.MockedFunction<DatabaseAdapter['queryLegacy']>;
}

export function createMockAuthContext(databaseAdapter: MockDatabaseAdapter): AuthContext {
  return { databaseAdapter } as unknown as AuthContext;
}

export function createDummyLogger(): Logger {
  const noop = () => {
    //empty
  };
  return {
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
  };
}

export function createMockTransactionContext(logger: Logger | null = null): TransactionContext {
  const resolvedLogger = logger || createDummyLogger();
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
    authCreatePrincipal: jest.fn(),
    authCreateSession: jest.fn(),
    schemaGetSpecification: jest.fn(),
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
    'authCreatePrincipal',
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

export function createMockSessionContext({
  schema,
}: {
  schema?: SchemaSpecification;
} = {}): SessionContext {
  const actualSchema = new Schema(schema ?? { entityTypes: [], valueTypes: [] });
  return {
    server: { getSchema: () => actualSchema },
  } as unknown as SessionContext; //TODO create a proper mock session context
}
