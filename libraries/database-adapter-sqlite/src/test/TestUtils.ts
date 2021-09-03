import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Context, DatabaseAdapter, Server } from '@jonasb/datadata-server';
import { ServerTestUtils } from '@jonasb/datadata-server';
import { createSqliteDatabaseAdapter, createSqlJsAdapter } from '..';
import type { SqliteDatabaseAdapter } from '..';

type QueryFn = SqliteDatabaseAdapter['query'];

interface MockedSqliteDatabaseAdapter extends SqliteDatabaseAdapter {
  query: jest.MockedFunction<QueryFn>;
}

export async function createSqliteTestAdapter(): Promise<DatabaseAdapter> {
  const sqlJsAdapter = await createSqlJsAdapter();
  return createSqliteDatabaseAdapter(sqlJsAdapter);
}

export function registerTestSuite(testSuite: TestSuite) {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}

export function createMockContext(adapter: SqliteDatabaseAdapter): Context {
  const databaseAdapter = createSqliteDatabaseAdapter(adapter);
  //TODO server
  return ServerTestUtils.createDummyContext(jest.fn() as unknown as Server, databaseAdapter);
}

export function createMockAdapter(): MockedSqliteDatabaseAdapter {
  const query: jest.MockedFunction<QueryFn> = jest.fn();
  return {
    disconnect: jest.fn(),
    query: jest.fn(),
  };
}

export function getQueryCalls(adapter: MockedSqliteDatabaseAdapter) {
  return adapter.query.mock.calls.map((call) => {
    const [query, values] = call;
    return [query, ...(values ?? [])];
  });
}
