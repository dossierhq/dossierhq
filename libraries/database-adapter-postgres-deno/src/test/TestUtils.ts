import type { ErrorType, PromiseResult } from "@dossierhq/core";
import { AdminSchema, ok } from "@dossierhq/core";
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchema,
  TestSuite,
} from "@jonasb/datadata-database-adapter-test-integration";
import type { Server } from "@jonasb/datadata-server";
import { createServer } from "@jonasb/datadata-server";
import { config } from "dotenv";
import { createPostgresAdapter } from "../PostgresAdapter.ts";

export interface ServerInit {
  server: Server;
  adminSchema: AdminSchema;
}

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
  ServerInit,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const databaseAdapter = createPostgresAdapter(
    config().DATABASE_URL,
  );

  const serverResult = await createServer({
    databaseAdapter,
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
  const adminSchema = new AdminSchema(schemaResult.value.schemaSpecification);

  return ok({ server, adminSchema });
}
