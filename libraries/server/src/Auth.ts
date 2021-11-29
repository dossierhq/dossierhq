import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  AuthCreateSessionPayload,
  AuthorizationAdapter,
  DatabaseAdapter,
  SessionContext,
  TransactionContext,
} from '.';
import { ensureRequired } from './Assertions';

// TODO freeze? seal? WeakMap?
export interface Session {
  //TODO remove subjectInternalId
  readonly subjectInternalId: number;
  /** UUID */
  readonly subjectId: string;
}

export interface ResolvedAuthKey {
  authKey: string;
  resolvedAuthKey: string;
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

export async function authResolveAuthorizationKey(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  authKey: string
): PromiseResult<
  ResolvedAuthKey,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  if (!authKey) {
    return notOk.BadRequest('No authKey provided');
  }
  const resolvedResult = await authorizationAdapter.resolveAuthorizationKeys(context, [authKey]);
  if (resolvedResult.isError()) {
    return resolvedResult;
  }
  const resolvedAuthKey = resolvedResult.value[authKey];
  if (!resolvedAuthKey) {
    return notOk.Generic(
      `Authorization adapter didn't return a key when resolving authKey (${authKey})`
    );
  }
  return ok({
    authKey,
    resolvedAuthKey,
  });
}
