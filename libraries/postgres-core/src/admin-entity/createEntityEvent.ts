import { type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseAdminEntityCreateEntityEventArg,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { createEntityEvent } from '../utils/EventUtils.js';

export async function adminEntityCreateEntityEvent(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  event: DatabaseAdminEntityCreateEntityEventArg,
): PromiseResult<void, typeof ErrorType.Generic> {
  return await createEntityEvent(
    databaseAdapter,
    context,
    event.session,
    event.type,
    event.references.map(({ entityVersionInternalId, publishedName }) => ({
      entityVersionsId: entityVersionInternalId as number,
      publishedName,
    })),
  );
}
