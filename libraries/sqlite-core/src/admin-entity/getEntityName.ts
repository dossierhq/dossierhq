import {
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';
import { assertIsDefined } from '../utils/AssertUtils.js';

export async function adminEntityGetEntityName(
  database: Database,
  context: TransactionContext,
  reference: EntityReference,
): PromiseResult<string, typeof ErrorType.NotFound | typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<EntitiesTable, 'name'>>(database, context, {
    text: 'SELECT e.name FROM entities e WHERE e.uuid = ?1',
    values: [reference.id],
  });
  if (result.isError()) return result;

  if (!result.value) {
    return notOk.NotFound('No such entity');
  }

  assertIsDefined(result.value.name);
  return ok(result.value.name);
}
