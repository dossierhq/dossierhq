import { AdminSchema } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { assertOkResult } from '../Asserts.js';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import { ServerRevalidateNextEntitySubSuite } from './ServerRevalidateNextEntitySubSuite.js';

export interface SchemaTestContext {
  server: Server;
}

export function createSchemaTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<SchemaTestContext, TCleanup>
): TestSuite {
  return buildSuite(
    initializer,
    getSchemaSpecification_normal,
    ...ServerRevalidateNextEntitySubSuite
  );
}

async function getSchemaSpecification_normal({ server }: SchemaTestContext) {
  const client = adminClientForMainPrincipal(server);
  const result = await client.getSchemaSpecification();
  assertOkResult(result);
  const schema = new AdminSchema(result.value);
  assertOkResult(schema.validate());
}
