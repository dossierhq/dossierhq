import type { AdminClient } from '@jonasb/datadata-core';
import { AdminSchema } from '@jonasb/datadata-core';
import type { TestFunctionInitializer, TestSuite } from '..';
import { assertOkResult } from '../Asserts';
import { buildSuite } from '../Builder';

export function createSchemaTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<{ client: AdminClient }, TCleanup>
): TestSuite {
  return buildSuite(initializer, getSchemaSpecification_normal);
}

async function getSchemaSpecification_normal({ client }: { client: AdminClient }) {
  const result = await client.getSchemaSpecification();
  if (assertOkResult(result)) {
    const schema = new AdminSchema(result.value);
    assertOkResult(schema.validate());
  }
}
