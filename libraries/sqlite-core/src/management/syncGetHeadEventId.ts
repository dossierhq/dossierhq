import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { EventsTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';

export async function managementSyncGetHeadEventId(
  database: Database,
  context: TransactionContext,
): PromiseResult<string | null, typeof ErrorType.Generic> {
  const result = await queryNoneOrOne<Pick<EventsTable, 'uuid'>>(
    database,
    context,
    'SELECT uuid FROM events ORDER BY id DESC LIMIT 1',
  );
  if (result.isError()) return result;
  return ok(result.value?.uuid ?? null);
}
