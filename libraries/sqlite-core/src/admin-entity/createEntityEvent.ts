import { type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseAdminEntityCreateEntityEventArg,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { createEntityEvent } from '../utils/EventUtils.js';

export async function adminEntityCreateEntityEvent(
  database: Database,
  context: TransactionContext,
  event: DatabaseAdminEntityCreateEntityEventArg,
): PromiseResult<void, typeof ErrorType.Generic> {
  return await createEntityEvent(
    database,
    context,
    event.session,
    event.type,
    event.references.map(({ entityVersionInternalId, publishedName }) => ({
      entityVersionsId: entityVersionInternalId as number,
      publishedName,
    })),
  );
}
