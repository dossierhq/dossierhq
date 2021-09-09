import type { ErrorType, PromiseResult, SchemaSpecification } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import { queryNone } from '../QueryFunctions';

export async function schemaUpdateSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  schemaSpec: SchemaSpecification
): PromiseResult<void, ErrorType.Generic> {
  return await queryNone(
    context,
    adapter,
    'INSERT INTO schema_versions (specification) VALUES ($1)',
    [schemaSpec]
  );
}
