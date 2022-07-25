import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchema,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { describe, it } from 'bun:test';
import { createAdapter } from '../ServerUtils.js';

export function registerTestSuite(suiteName: string, testSuite: TestSuite): void {
  describe(suiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      it(testName, testFunction);
    }
  });
}

export async function initializeIntegrationTestServer(
  filename: string
): PromiseResult<Server, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const serverResult = await createServer({
    databaseAdapter: (await createAdapter({ logger: NoOpLogger }, filename)).valueOrThrow(),
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = server.createSession({
    provider: 'test',
    identifier: 'schema-loader',
    defaultAuthKeys: [],
  });
  const client = server.createAdminClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;

  return serverResult;
}
