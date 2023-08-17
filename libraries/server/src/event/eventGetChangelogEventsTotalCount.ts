import { type ChangelogQuery, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';

export async function eventGetChangelogEventsTotalCount(
  _authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: ChangelogQuery | undefined,
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  return databaseAdapter.eventGetChangelogEventsTotalCount(context, query ?? {});
}
