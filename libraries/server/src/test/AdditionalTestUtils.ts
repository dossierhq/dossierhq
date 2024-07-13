import { NoOpLogger, ok, type Logger } from '@dossierhq/core';
import type { DatabaseAdapter, Session, TransactionContext } from '@dossierhq/database-adapter';
import { vi, type MockInstance } from 'vitest';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import { SessionContextImpl, type SessionContext } from '../Context.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = MockInstance<TFn> & TFn;

export interface MockDatabaseAdapter extends DatabaseAdapter {
  adminEntityCreate: MockedFunction<DatabaseAdapter['adminEntityCreate']>;
  adminEntityGetOne: MockedFunction<DatabaseAdapter['adminEntityGetOne']>;
  adminEntityGetReferenceEntitiesInfo: MockedFunction<
    DatabaseAdapter['adminEntityGetReferenceEntitiesInfo']
  >;
  adminEntityIndexesUpdateLatest: MockedFunction<DatabaseAdapter['adminEntityIndexesUpdateLatest']>;
  adminEntityIndexesUpdatePublished: MockedFunction<
    DatabaseAdapter['adminEntityIndexesUpdatePublished']
  >;
  adminEntityPublishGetVersionInfo: MockedFunction<
    DatabaseAdapter['adminEntityPublishGetVersionInfo']
  >;
  adminEntityCreateEntityEvent: MockedFunction<DatabaseAdapter['adminEntityCreateEntityEvent']>;
  adminEntityPublishUpdateEntity: MockedFunction<DatabaseAdapter['adminEntityPublishUpdateEntity']>;
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
  publishedEntityGetOne: MockedFunction<DatabaseAdapter['publishedEntityGetOne']>;
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
  const resolvedLogger = logger ?? NoOpLogger;
  const context: TransactionContext = {
    get logger() {
      return resolvedLogger;
    },
    get databasePerformance() {
      return null;
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
  defaultAuthKeys?: string[] | null;
  logger?: Logger;
}): SessionContext {
  const resolvedSession = session ?? {
    type: 'write',
    subjectId: 'subject-id',
    subjectInternalId: 123,
  };
  const resolvedDefaultAuthKeys = defaultAuthKeys ?? [''];
  const resolvedLogger = logger ?? NoOpLogger;
  return new SessionContextImpl(
    resolvedSession,
    resolvedDefaultAuthKeys,
    databaseAdapter,
    resolvedLogger,
    null,
  );
}

export function createMockDatabaseAdapter(): MockDatabaseAdapter {
  const adapter: MockDatabaseAdapter = {
    adminEntityArchivingGetEntityInfo: vi.fn(),
    adminEntityCreate: vi.fn(),
    adminEntityDeleteEntities: vi.fn(),
    adminEntityDeleteGetEntityInfo: vi.fn(),
    adminEntityGetEntityName: vi.fn(),
    adminEntityGetMultiple: vi.fn(),
    adminEntityGetOne: vi.fn(),
    adminEntityGetReferenceEntitiesInfo: vi.fn(),
    adminEntityIndexesUpdateLatest: vi.fn(),
    adminEntityIndexesUpdatePublished: vi.fn(),
    adminEntityPublishGetVersionInfo: vi.fn(),
    adminEntityCreateEntityEvent: vi.fn(),
    adminEntityPublishUpdateEntity: vi.fn(),
    adminEntitySampleEntities: vi.fn(),
    adminEntitySearchEntities: vi.fn(),
    adminEntitySearchTotalCount: vi.fn(),
    adminEntityUniqueIndexGetValues: vi.fn(),
    adminEntityUniqueIndexUpdateValues: vi.fn(),
    adminEntityUnpublishEntities: vi.fn(),
    adminEntityUnpublishGetEntitiesInfo: vi.fn(),
    adminEntityUnpublishGetPublishedReferencedEntities: vi.fn(),
    adminEntityUpdateEntity: vi.fn(),
    adminEntityUpdateGetEntityInfo: vi.fn(),
    adminEntityUpdateStatus: vi.fn(),
    advisoryLockAcquire: vi.fn(),
    advisoryLockDeleteExpired: vi.fn(),
    advisoryLockRelease: vi.fn(),
    advisoryLockRenew: vi.fn(),
    authCreateSession: vi.fn(),
    authCreateSyncSessionForSubject: vi.fn(),
    authGetPrincipals: vi.fn(),
    authGetPrincipalsTotalCount: vi.fn(),
    eventGetChangelogEvents: vi.fn(),
    eventGetChangelogEventsEntityInfo: vi.fn(),
    eventGetChangelogEventsTotalCount: vi.fn(),
    disconnect: vi.fn(),
    managementDirtyGetNextEntity: vi.fn(),
    managementDirtyMarkEntities: vi.fn(),
    managementDirtyUpdateEntity: vi.fn(),
    managementOptimize: vi.fn(),
    managementSyncGetEvents: vi.fn(),
    managementSyncGetHeadEventId: vi.fn(),
    publishedEntityGetEntities: vi.fn(),
    publishedEntityGetOne: vi.fn(),
    publishedEntitySampleEntities: vi.fn(),
    publishedEntitySearchEntities: vi.fn(),
    publishedEntitySearchTotalCount: vi.fn(),
    schemaGetSpecification: vi.fn(),
    schemaUpdateCountEntitiesWithTypes: vi.fn(),
    schemaUpdateDeleteComponentTypesFromIndexes: vi.fn(),
    schemaUpdateModifyIndexes: vi.fn(),
    schemaUpdateRenameTypes: vi.fn(),
    schemaUpdateSpecification: vi.fn(),
    withNestedTransaction: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withRootTransaction: vi.fn() as MockDatabaseAdapter['withRootTransaction'],
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
  adapter.resolveAuthorizationKeys.mockReturnValueOnce(
    Promise.resolve(ok([{ authKey: '', resolvedAuthKey: '' }])),
  );
  return adapter;
}

export function getDatabaseAdapterMockedCallsWithoutContextAndUnordered(
  databaseAdapter: MockDatabaseAdapter,
): unknown[][] {
  const calls: unknown[][] = [];
  for (const methodName of Object.keys(databaseAdapter).sort() as (keyof MockDatabaseAdapter)[]) {
    for (const args of (databaseAdapter[methodName] as unknown as MockedFunction<() => void>).mock
      .calls) {
      // remove first arg (normally context)
      calls.push([methodName, ...args.slice(1)]);
    }
  }
  return calls;
}
