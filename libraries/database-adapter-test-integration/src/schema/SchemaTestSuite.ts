import type { AdminClient } from '@jonasb/datadata-core';
import { AdminSchema } from '@jonasb/datadata-core';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import { assertOkResult } from '../Asserts.js';
import { buildSuite } from '../Builder.js';

export function createSchemaTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<{ client: AdminClient }, TCleanup>
): TestSuite {
  return buildSuite(initializer, getSchemaSpecification_normal);
}

async function getSchemaSpecification_normal({ client }: { client: AdminClient }) {
  const result = await client.getSchemaSpecification();
  assertOkResult(result);
  const schema = new AdminSchema(result.value);
  assertOkResult(schema.validate());
}
