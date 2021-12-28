import type { Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type {
  AuthorizationAdapter,
  DatabaseAdapter,
  Session,
  SessionContext,
  TransactionContext,
} from '..';
import { SessionContextImpl } from '../Context';

interface MockDatabaseAdapter extends DatabaseAdapter {
  adminEntityCreate: jest.MockedFunction<DatabaseAdapter['adminEntityCreate']>;
  authCreateSession: jest.MockedFunction<DatabaseAdapter['authCreateSession']>;
  schemaGetSpecification: jest.MockedFunction<DatabaseAdapter['schemaGetSpecification']>;
  schemaUpdateSpecification: jest.MockedFunction<DatabaseAdapter['schemaUpdateSpecification']>;
  queryLegacy: jest.MockedFunction<DatabaseAdapter['queryLegacy']>;
  withRootTransaction: jest.MockedFunction<DatabaseAdapter['withRootTransaction']>;
}

interface MockAuthorizationAdapter extends AuthorizationAdapter {
  resolveAuthorizationKeys: jest.MockedFunction<AuthorizationAdapter['resolveAuthorizationKeys']>;
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

export function createMockSessionContext({
  databaseAdapter,
  session,
  defaultAuthKeys,
  logger,
}: {
  databaseAdapter: DatabaseAdapter;
  session?: Session;
  defaultAuthKeys?: string[];
  logger?: Logger;
}): SessionContext {
  const resolvedSession = session ?? { subjectId: 'subject-id', subjectInternalId: 123 };
  const resolvedDefaultAuthKeys = defaultAuthKeys ?? ['none'];
  const resolvedLogger = logger || NoOpLogger;
  return new SessionContextImpl(
    resolvedSession,
    resolvedDefaultAuthKeys,
    databaseAdapter,
    resolvedLogger,
    null
  );
}

export function createMockDatabaseAdapter(): MockDatabaseAdapter {
  const adapter: MockDatabaseAdapter = {
    disconnect: jest.fn(),
    adminEntityGetOne: jest.fn(),
    authCreateSession: jest.fn(),
    schemaGetSpecification: jest.fn(),
    schemaUpdateSpecification: jest.fn(),
    adminEntityCreate: jest.fn(),
    queryLegacy: jest.fn(),
    withRootTransaction: jest.fn(),
    withNestedTransaction: jest.fn(),
    isUniqueViolationOfConstraint: jest.fn(),
  };

  adapter.withRootTransaction.mockImplementation((callback) => {
    return callback({
      _type: 'Transaction',
    });
  });

  return adapter;
}

export function createMockAuthorizationAdapter(): MockAuthorizationAdapter {
  const adapter: MockAuthorizationAdapter = {
    resolveAuthorizationKeys: jest.fn(),
  };
  return adapter;
}

export function getDatabaseAdapterMockedCallsWithoutContextAndUnordered(
  databaseAdapter: MockDatabaseAdapter
): Array<unknown[]> {
  const calls: Array<unknown[]> = [];
  const mocksWithInitialContextArg: (keyof MockDatabaseAdapter)[] = [
    'adminEntityCreate',
    'authCreateSession',
    'schemaGetSpecification',
    'withRootTransaction',
  ];
  for (const methodName of mocksWithInitialContextArg) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const args of (databaseAdapter[methodName] as jest.MockedFunction<any>).mock.calls) {
      calls.push([methodName, ...args.slice(1)]);
    }
  }
  return calls;
}
