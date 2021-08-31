import type { SchemaSpecification } from '@jonasb/datadata-core';
import { Schema } from '@jonasb/datadata-core';
import type { DatabaseAdapter, SessionContext } from '..';
import type { AuthContext } from '../Context';

interface MockDatabaseAdapter extends DatabaseAdapter {
  authCreatePrincipal: jest.MockedFunction<DatabaseAdapter['authCreatePrincipal']>;
  queryLegacy: jest.MockedFunction<DatabaseAdapter['queryLegacy']>;
}

export function createMockAuthContext(databaseAdapter: MockDatabaseAdapter): AuthContext {
  return { databaseAdapter } as unknown as AuthContext;
}

export function createMockDatabaseAdapter(): MockDatabaseAdapter {
  return {
    authCreatePrincipal: jest.fn(),
    queryLegacy: jest.fn(),
  } as unknown as MockDatabaseAdapter;
}

export function getDatabaseAdapterMockedCallsWithoutContextAndUnordered(
  databaseAdapter: MockDatabaseAdapter
): Array<unknown[]> {
  const calls: Array<unknown[]> = [];
  for (const args of databaseAdapter.authCreatePrincipal.mock.calls) {
    calls.push(['authCreatePrincipal', ...args.slice(1)]);
  }
  for (const args of databaseAdapter.queryLegacy.mock.calls) {
    calls.push(['queryLegacy', ...args.slice(1)]);
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
