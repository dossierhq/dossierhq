import { Schema } from '@dossierhq/core';
import { assertOkResult } from '../Asserts.js';
import { type UnboundTestFunction } from '../Builder.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const SchemaGetSchemaSpecificationSubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  getSchemaSpecification_normal,
];

async function getSchemaSpecification_normal({ clientProvider }: SchemaTestContext) {
  const client = clientProvider.dossierClient();
  const result = await client.getSchemaSpecification();
  assertOkResult(result);
  const schema = new Schema(result.value);
  assertOkResult(schema.validate());
}
