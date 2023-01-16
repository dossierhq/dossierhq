import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function adminEntityGetEntityName(
  database: Database,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<string, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<EntitiesTable, 'name'>>(database, context, {
    text: 'SELECT e.name FROM entities e WHERE e.uuid = ?1',
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
