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

export async function authVerifyAuthorizationKey(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  requestedAuthKeys: string[] | undefined,
  actualAuthKey: ResolvedAuthKey
): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic> {
  const expectedAuthKeys =
    requestedAuthKeys && requestedAuthKeys.length > 0 ? requestedAuthKeys : context.defaultAuthKeys;
  if (expectedAuthKeys.length === 0) {
    return notOk.BadRequest('No authKey provided');
  }

  if (!expectedAuthKeys.includes(actualAuthKey.authKey)) {
    return notOk.NotAuthorized('Wrong authKey provided');
  }

  const resolvedResult = await authResolveAuthorizationKey(
    authorizationAdapter,
    context,
    actualAuthKey.authKey
  );
  if (resolvedResult.isError()) {
    return resolvedResult;
  }
  const expectedAuthKey = resolvedResult.value;

  if (
    expectedAuthKey.authKey !== actualAuthKey.authKey ||
    expectedAuthKey.resolvedAuthKey !== actualAuthKey.resolvedAuthKey
  ) {
    return notOk.NotAuthorized('Wrong authKey provided');
  }

  return ok(undefined);
}
