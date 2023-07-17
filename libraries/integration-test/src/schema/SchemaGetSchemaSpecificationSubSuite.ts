import { AdminSchema } from '@dossierhq/core';
import { assertOkResult } from '../Asserts.js';
import { type UnboundTestFunction } from '../Builder.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const SchemaGetSchemaSpecificationSubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  getSchemaSpecification_normal,
];

async function getSchemaSpecification_normal({ server }: SchemaTestContext) {
  const client = adminClientForMainPrincipal(server);
  const result = await client.getSchemaSpecification();
  assertOkResult(result);
  const schema = new AdminSchema(result.value);
  assertOkResult(schema.validate());
}
