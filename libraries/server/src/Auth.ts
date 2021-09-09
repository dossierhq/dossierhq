import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { AuthCreateSessionPayload, DatabaseAdapter, TransactionContext } from '.';
import { ensureRequired } from './Assertions';

export interface Session {
  readonly subjectInternalId: number;
  /** UUID */
  readonly subjectId: string;
}

export async function authCreateSession(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<AuthCreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic> {
  const assertion = ensureRequired({ provider, identifier });
  if (assertion.isError()) {
    return assertion;
  }

  return await databaseAdapter.authCreateSession(context, provider, identifier);
}
