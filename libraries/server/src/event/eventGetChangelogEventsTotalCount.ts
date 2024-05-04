import { type ChangelogEventQuery, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { getEntityInfoAndAuthorize } from './eventGetChangelogEvents.js';

export async function eventGetChangelogEventsTotalCount(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: ChangelogEventQuery | undefined,
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const entityResult = await getEntityInfoAndAuthorize(
    authorizationAdapter,
    databaseAdapter,
    context,
    query,
  );
  if (entityResult.isError()) return entityResult;

  return databaseAdapter.eventGetChangelogEventsTotalCount(
    context,
    query ?? {},
    entityResult.value,
  );
}
