import type { ErrorType, PromiseResult } from "@jonasb/datadata-core";
import type { Server } from "@jonasb/datadata-server";
import { createServer } from "@jonasb/datadata-server";
import { createDotenvAdapter } from "../ServerUtils.ts";
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchema,
  TestSuite,
} from "@jonasb/datadata-database-adapter-test-integration";

export function registerTestSuite(
  testSuite: TestSuite,
  subset?: { page: number; totalPages: number },
) {
  let testSuiteToAdd = Object.entries(testSuite);
  if (subset) {
    const { page, totalPages } = subset;
    const testsPerPage = Math.ceil(testSuiteToAdd.length / totalPages);
    const offset = page * testsPerPage;
    testSuiteToAdd = testSuiteToAdd.slice(offset, offset + testsPerPage);
  }

  for (const [testName, testFunction] of testSuiteToAdd) {
    Deno.test({ name: testName, fn: testFunction });
  }
}

export async function initializeIntegrationTestServer(): PromiseResult<
  Server,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const serverResult = await createServer({
    databaseAdapter: createDotenvAdapter(),
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = server.createSession({
    provider: "test",
    identifier: "schema-loader",
    defaultAuthKeys: [],
  });
  const client = server.createAdminClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(
    IntegrationTestSchema,
  );
  if (schemaResult.isError()) return schemaResult;

  return serverResult;
}
