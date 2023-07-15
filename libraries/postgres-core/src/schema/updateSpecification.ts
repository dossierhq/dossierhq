import type { ErrorType, PromiseResult, AdminSchemaSpecification } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';

export async function schemaUpdateSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecification,
): PromiseResult<void, typeof ErrorType.Generic> {
  const { version, ...schemaSpecWithoutVersion } = schemaSpec;
  return await queryNone(adapter, context, {
    text: 'INSERT INTO schema_versions (version, specification) VALUES ($1, $2)',
    values: [version, schemaSpecWithoutVersion],
  });
}
