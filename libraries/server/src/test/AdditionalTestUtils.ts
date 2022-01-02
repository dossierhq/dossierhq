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
  adminEntityGetOne: jest.MockedFunction<DatabaseAdapter['adminEntityGetOne']>;
  adminEntityPublishGetUnpublishedReferencedEntities: jest.MockedFunction<
    DatabaseAdapter['adminEntityPublishGetUnpublishedReferencedEntities']
  >;
  adminEntityPublishGetVersionInfo: jest.MockedFunction<
    DatabaseAdapter['adminEntityPublishGetVersionInfo']
  >;
  adminEntityPublishingCreateEvents: jest.MockedFunction<
    DatabaseAdapter['adminEntityPublishingCreateEvents']
  >;
  adminEntityPublishUpdateEntity: jest.MockedFunction<
    DatabaseAdapter['adminEntityPublishUpdateEntity']
  >;
  authCreateSession: jest.MockedFunction<DatabaseAdapter['authCreateSession']>;
  queryLegacy: jest.MockedFunction<DatabaseAdapter['queryLegacy']>;
  schemaGetSpecification: jest.MockedFunction<DatabaseAdapter['schemaGetSpecification']>;
  schemaUpdateSpecification: jest.MockedFunction<DatabaseAdapter['schemaUpdateSpecification']>;
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
    adminEntityArchivingGetEntityInfo: jest.fn(),
    adminEntityUpdateStatus: jest.fn(),
    adminEntityCreate: jest.fn(),
    adminEntityGetOne: jest.fn(),
    adminEntityGetEntityName: jest.fn(),
    adminEntityPublishGetUnpublishedReferencedEntities: jest.fn(),
    adminEntityPublishGetVersionInfo: jest.fn(),
    adminEntityPublishingCreateEvents: jest.fn(),
    adminEntityPublishUpdateEntity: jest.fn(),
    adminEntityUpdateEntity: jest.fn(),
    adminEntityUpdateGetEntityInfo: jest.fn(),
    adminEntityUnpublishGetEntitiesInfo: jest.fn(),
    adminEntityUnpublishEntities: jest.fn(),
    adminEntityUnpublishGetPublishedReferencedEntities: jest.fn(),
    authCreateSession: jest.fn(),
    disconnect: jest.fn(),
    publishedEntityGetOne: jest.fn(),
    queryLegacy: jest.fn(),
    schemaGetSpecification: jest.fn(),
    schemaUpdateSpecification: jest.fn(),
    withNestedTransaction: jest.fn(),
    withRootTransaction: jest.fn(),
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
  for (const methodName of Object.keys(databaseAdapter).sort() as (keyof MockDatabaseAdapter)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const args of (databaseAdapter[methodName] as jest.MockedFunction<any>).mock.calls) {
      // remove first arg (normally context)
      calls.push([methodName, ...args.slice(1)]);
    }
  }
  return calls;
}
