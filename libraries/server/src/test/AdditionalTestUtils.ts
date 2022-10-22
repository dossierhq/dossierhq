import type { Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  Session,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { SpyInstance } from 'vitest';
import { vi } from 'vitest';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { SessionContextImpl } from '../Context.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = SpyInstance<
  Parameters<TFn>,
  ReturnType<TFn>
> &
  TFn;

interface MockDatabaseAdapter extends DatabaseAdapter {
  adminEntityCreate: MockedFunction<DatabaseAdapter['adminEntityCreate']>;
  adminEntityGetOne: MockedFunction<DatabaseAdapter['adminEntityGetOne']>;
  adminEntityGetReferenceEntitiesInfo: MockedFunction<
    DatabaseAdapter['adminEntityGetReferenceEntitiesInfo']
  >;
  adminEntityPublishGetVersionInfo: MockedFunction<
    DatabaseAdapter['adminEntityPublishGetVersionInfo']
  >;
  adminEntityPublishingCreateEvents: MockedFunction<
    DatabaseAdapter['adminEntityPublishingCreateEvents']
  >;
  adminEntityPublishUpdateEntity: MockedFunction<DatabaseAdapter['adminEntityPublishUpdateEntity']>;
  adminEntityPublishUpdatePublishedReferencesIndex: MockedFunction<
    DatabaseAdapter['adminEntityPublishUpdatePublishedReferencesIndex']
  >;
  adminEntitySampleEntities: MockedFunction<DatabaseAdapter['adminEntitySampleEntities']>;
  adminEntitySearchEntities: MockedFunction<DatabaseAdapter['adminEntitySearchEntities']>;
  adminEntitySearchTotalCount: MockedFunction<DatabaseAdapter['adminEntitySearchTotalCount']>;
  adminEntityUniqueIndexGetValues: MockedFunction<
    DatabaseAdapter['adminEntityUniqueIndexGetValues']
  >;
  adminEntityUniqueIndexUpdateValues: MockedFunction<
    DatabaseAdapter['adminEntityUniqueIndexUpdateValues']
  >;
  adminEntityUpdateEntity: MockedFunction<DatabaseAdapter['adminEntityUpdateEntity']>;
  adminEntityUpdateGetEntityInfo: MockedFunction<DatabaseAdapter['adminEntityUpdateGetEntityInfo']>;
  advisoryLockAcquire: MockedFunction<DatabaseAdapter['advisoryLockAcquire']>;
  advisoryLockDeleteExpired: MockedFunction<DatabaseAdapter['advisoryLockDeleteExpired']>;
  advisoryLockRelease: MockedFunction<DatabaseAdapter['advisoryLockRelease']>;
  advisoryLockRenew: MockedFunction<DatabaseAdapter['advisoryLockRenew']>;
  authCreateSession: MockedFunction<DatabaseAdapter['authCreateSession']>;
  publishedEntitySampleEntities: MockedFunction<DatabaseAdapter['publishedEntitySampleEntities']>;
  publishedEntitySearchEntities: MockedFunction<DatabaseAdapter['publishedEntitySearchEntities']>;
  publishedEntitySearchTotalCount: MockedFunction<
    DatabaseAdapter['publishedEntitySearchTotalCount']
  >;
  schemaGetSpecification: MockedFunction<DatabaseAdapter['schemaGetSpecification']>;
  schemaUpdateSpecification: MockedFunction<DatabaseAdapter['schemaUpdateSpecification']>;
  withRootTransaction: MockedFunction<DatabaseAdapter['withRootTransaction']>;
}

interface MockAuthorizationAdapter extends AuthorizationAdapter {
  resolveAuthorizationKeys: MockedFunction<AuthorizationAdapter['resolveAuthorizationKeys']>;
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
    withTransaction: vi.fn(),
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
    adminEntityArchivingGetEntityInfo: vi.fn(),
    adminEntityUpdateStatus: vi.fn(),
    adminEntityCreate: vi.fn(),
    adminEntityGetOne: vi.fn(),
    adminEntityGetMultiple: vi.fn(),
    adminEntityGetEntityName: vi.fn(),
    adminEntityGetReferenceEntitiesInfo: vi.fn(),
    adminEntityHistoryGetEntityInfo: vi.fn(),
    adminEntityHistoryGetVersionsInfo: vi.fn(),
    adminEntityPublishUpdatePublishedReferencesIndex: vi.fn(),
    adminEntityPublishGetVersionInfo: vi.fn(),
    adminEntityPublishingCreateEvents: vi.fn(),
    adminEntityPublishingHistoryGetEntityInfo: vi.fn(),
    adminEntityPublishingHistoryGetEvents: vi.fn(),
    adminEntityPublishUpdateEntity: vi.fn(),
    adminEntitySampleEntities: vi.fn(),
    adminEntitySearchEntities: vi.fn(),
    adminEntitySearchTotalCount: vi.fn(),
    adminEntityUniqueIndexGetValues: vi.fn(),
    adminEntityUniqueIndexUpdateValues: vi.fn(),
    adminEntityUpdateEntity: vi.fn(),
    adminEntityUpdateGetEntityInfo: vi.fn(),
    adminEntityUnpublishGetEntitiesInfo: vi.fn(),
    adminEntityUnpublishEntities: vi.fn(),
    adminEntityUnpublishGetPublishedReferencedEntities: vi.fn(),
    advisoryLockAcquire: vi.fn(),
    advisoryLockDeleteExpired: vi.fn(),
    advisoryLockRelease: vi.fn(),
    advisoryLockRenew: vi.fn(),
    authCreateSession: vi.fn(),
    disconnect: vi.fn(),
    publishedEntityGetOne: vi.fn(),
    publishedEntityGetEntities: vi.fn(),
    publishedEntitySampleEntities: vi.fn(),
    publishedEntitySearchEntities: vi.fn(),
    publishedEntitySearchTotalCount: vi.fn(),
    schemaGetSpecification: vi.fn(),
    schemaUpdateSpecification: vi.fn(),
    withNestedTransaction: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withRootTransaction: vi.fn<any, any>(),
  };

  adapter.withRootTransaction.mockImplementation((context, childContextFactory, callback) => {
    const childContext = childContextFactory({
      _type: 'Transaction',
    });
    return callback(childContext);
  });

  return adapter;
}

export function createMockAuthorizationAdapter(): MockAuthorizationAdapter {
  const adapter: MockAuthorizationAdapter = {
    resolveAuthorizationKeys: vi.fn(),
  };
  return adapter;
}

export function getDatabaseAdapterMockedCallsWithoutContextAndUnordered(
  databaseAdapter: MockDatabaseAdapter
): Array<unknown[]> {
  const calls: Array<unknown[]> = [];
  for (const methodName of Object.keys(databaseAdapter).sort() as (keyof MockDatabaseAdapter)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const args of (databaseAdapter[methodName] as MockedFunction<any>).mock.calls) {
      // remove first arg (normally context)
      calls.push([methodName, ...args.slice(1)]);
    }
  }
  return calls;
}
