import type { ErrorType, PromiseResult, Result } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAuthCreateSessionPayload,
  TransactionContext,
  ResolvedAuthKey,
  Session,
} from '@dossierhq/database-adapter';
import { ensureRequired } from './utils/ValidationUtils.js';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';

export async function authCreateSession(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string,
): PromiseResult<
  DatabaseAuthCreateSessionPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const assertion = ensureRequired({ provider, identifier });
  if (assertion.isError()) return assertion;

  return await databaseAdapter.authCreateSession(context, provider, identifier);
}

/** N.B. don't use this function normally, instead use {@link authCreateSession}.
 *
 * This function is used to create a session for a sync event where we only have the subject id,
 * not provider and identifier which we normally use.
 */
export async function authCreateSyncSessionForSubject(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  arg: { subjectId: string },
): PromiseResult<Session, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (!arg.subjectId) {
    return notOk.BadRequest('No subject provided');
  }
  return await databaseAdapter.authCreateSyncSessionForSubject(context, arg);
}

//TODO harmonize with core
function verifyAuthKeyFormat(authKey: string): Result<void, typeof ErrorType.BadRequest> {
  if (!authKey) {
    return notOk.BadRequest('No authKey provided');
  }
  if (authKey.trimStart() !== authKey) {
    return notOk.BadRequest(`Invalid authKey (${authKey}), can’t start with whitespace`);
  }
  if (authKey.trimEnd() !== authKey) {
    return notOk.BadRequest(`Invalid authKey (${authKey}), can’t end with whitespace`);
  }
  if (authKey.includes(',')) {
    // Don't allow commas since it makes CSV error prone in HTTP header
    return notOk.BadRequest(`Invalid authKey (${authKey}), can’t contain comma`);
  }
  return ok(undefined);
}

export function verifyAuthKeysFormat(
  authKeys: Readonly<string[]>,
): Result<void, typeof ErrorType.BadRequest> {
  for (const authKey of authKeys) {
    const result = verifyAuthKeyFormat(authKey);
    if (result.isError()) return result;
  }
  return ok(undefined);
}

export async function authResolveAuthorizationKey(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  authKey: string,
): PromiseResult<
  ResolvedAuthKey,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const verifyResult = verifyAuthKeyFormat(authKey);
  if (verifyResult.isError()) return verifyResult;

  const resolvedResult = await authorizationAdapter.resolveAuthorizationKeys(context, [authKey]);
  if (resolvedResult.isError()) return resolvedResult;

  const resolvedAuthKey = resolvedResult.value.find((it) => it.authKey === authKey);
  if (!resolvedAuthKey) {
    return notOk.Generic(
      `Authorization adapter didn't return a key when resolving authKey (${authKey})`,
    );
  }
  return ok(resolvedAuthKey);
}

export async function authResolveAuthorizationKeys(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  requestedAuthKeys: string[] | undefined,
): PromiseResult<
  ResolvedAuthKey[],
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const expectedAuthKeys =
    requestedAuthKeys && requestedAuthKeys.length > 0 ? requestedAuthKeys : context.defaultAuthKeys;
  if (expectedAuthKeys.length === 0) {
    return notOk.BadRequest('No authKeys provided');
  }

  const verifyResult = verifyAuthKeysFormat(expectedAuthKeys);
  if (verifyResult.isError()) return verifyResult;

  return await authorizationAdapter.resolveAuthorizationKeys(context, expectedAuthKeys);
}

export async function authVerifyAuthorizationKey(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  actualAuthKey: ResolvedAuthKey,
): PromiseResult<
  void,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const resolveResult = await authResolveAuthorizationKeys(authorizationAdapter, context, [
    actualAuthKey.authKey,
  ]);
  if (resolveResult.isError()) return resolveResult;

  for (const expectedAuthKey of resolveResult.value) {
    if (expectedAuthKey.resolvedAuthKey === actualAuthKey.resolvedAuthKey) {
      return ok(undefined);
    }
  }
  return notOk.NotAuthorized('Wrong authKey provided');
}
