import type { ErrorType, PromiseResult } from "@jonasb/datadata-core";
import type { Server } from "@jonasb/datadata-server";
import { createServer } from "@jonasb/datadata-server";
import { createDotenvAdapter } from "../ServerUtils.ts";
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchemaSpecifciationUpdate,
  TestSuite,
} from "@jonasb/datadata-database-adapter-test-integration";

export function registerTestSuite(
  testSuite: TestSuite,
  part?: [number, number],
) {
  let testSuiteToAdd = Object.entries(testSuite);
  if (part) {
    const [page, totalPages] = part;
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
  ErrorType.BadRequest | ErrorType.Generic
> {
  const serverResult = await createServer({
    databaseAdapter: createDotenvAdapter(),
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;
  const client = server.createAdminClient(() =>
    server.createSession({
      provider: "test",
      identifier: "schema-loader",
      defaultAuthKeys: [],
    })
  );

  const schemaResult = await client.updateSchemaSpecification(
    IntegrationTestSchemaSpecifciationUpdate,
  );
  if (schemaResult.isError()) {
    return schemaResult;
  }

  return serverResult;
}
