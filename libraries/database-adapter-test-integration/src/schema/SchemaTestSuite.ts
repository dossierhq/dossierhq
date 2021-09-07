import type { AdminClient } from '@jonasb/datadata-core';
import { CoreTestUtils, Schema } from '@jonasb/datadata-core';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';

const { expectOkResult } = CoreTestUtils;

export function createSchemaTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<{ client: AdminClient }, TCleanup>
): TestSuite {
  return buildSuite(initializer, getSchemaSpecification_normal);
}

async function getSchemaSpecification_normal({ client }: { client: AdminClient }) {
  const result = await client.getSchemaSpecification();
  if (expectOkResult(result)) {
    const schema = new Schema(result.value);
    expectOkResult(schema.validate());
  }
}
