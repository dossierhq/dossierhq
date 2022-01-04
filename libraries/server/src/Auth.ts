import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  DatabaseAuthCreateSessionPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { AuthorizationAdapter, SessionContext } from '.';
import { ensureRequired } from './Assertions';

export async function authCreateSession(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string
): PromiseResult<DatabaseAuthCreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic> {
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

export async function authResolveAuthorizationKeys(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  requestedAuthKeys: string[] | undefined
): PromiseResult<
  ResolvedAuthKey[],
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const expectedAuthKeys =
    requestedAuthKeys && requestedAuthKeys.length > 0 ? requestedAuthKeys : context.defaultAuthKeys;
  if (expectedAuthKeys.length === 0) {
    return notOk.BadRequest('No authKeys provided');
  }

  const resolvedResult = await authorizationAdapter.resolveAuthorizationKeys(
    context,
    expectedAuthKeys
  );
  if (resolvedResult.isError()) {
    return resolvedResult;
  }

  const result: ResolvedAuthKey[] = [];
  for (const authKey of expectedAuthKeys) {
    const resolvedAuthKey = resolvedResult.value[authKey];
    if (!resolvedAuthKey) {
      return notOk.Generic(
        `Authorization adapter didn't return a key when resolving authKey (${authKey})`
      );
    }
    result.push({ authKey, resolvedAuthKey });
  }
  return ok(result);
}

export async function authVerifyAuthorizationKey(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  actualAuthKey: ResolvedAuthKey
): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic> {
  const resolveResult = await authResolveAuthorizationKeys(authorizationAdapter, context, [
    actualAuthKey.authKey,
  ]);
  if (resolveResult.isError()) {
    return resolveResult;
  }

  for (const expectedAuthKey of resolveResult.value) {
    if (
      expectedAuthKey.authKey === actualAuthKey.authKey &&
      expectedAuthKey.resolvedAuthKey === actualAuthKey.resolvedAuthKey
    ) {
      return ok(undefined);
    }
  }
  return notOk.NotAuthorized('Wrong authKey provided');
}
