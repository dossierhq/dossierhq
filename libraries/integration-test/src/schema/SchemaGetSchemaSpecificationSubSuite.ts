import { AdminSchema } from '@dossierhq/core';
import { assertOkResult } from '../Asserts.js';
import { type UnboundTestFunction } from '../Builder.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const SchemaGetSchemaSpecificationSubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  getSchemaSpecification_normal,
];

async function getSchemaSpecification_normal({ clientProvider }: SchemaTestContext) {
  const adminClient = clientProvider.adminClient();
  const result = await adminClient.getSchemaSpecification();
  assertOkResult(result);
  const schema = new AdminSchema(result.value);
  assertOkResult(schema.validate());
}
