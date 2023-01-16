import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { EntitiesTable } from '../DatabaseSchema.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function adminEntityGetEntityName(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<string, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<EntitiesTable, 'name'>>(databaseAdapter, context, {
    text: 'SELECT e.name FROM entities e WHERE e.uuid = $1',
    values: [reference.id],
  });

  if (result.isError()) {
    return result;
  }

  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  return ok(result.value.name);
}
