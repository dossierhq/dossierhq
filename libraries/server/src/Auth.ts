import {
  notOk,
  ok,
  type ErrorType,
  type PromiseResult,
  type Result,
  type CreatePrincipalSyncEvent,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAuthCreateSessionPayload,
  ResolvedAuthKey,
  TransactionContext,
  WriteSession,
} from '@dossierhq/database-adapter';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { SessionContext } from './Context.js';
import { ensureRequired } from './utils/ValidationUtils.js';

export async function authCreateSession(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  provider: string,
  identifier: string,
  readonly: boolean,
): PromiseResult<
  DatabaseAuthCreateSessionPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const assertion = ensureRequired({ provider, identifier });
  if (assertion.isError()) return assertion;

  return await databaseAdapter.authCreateSession(context, provider, identifier, readonly, null);
}

export async function authCreatePrincipalSyncEvent(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  event: CreatePrincipalSyncEvent,
) {
  return await databaseAdapter.authCreateSession(
    context,
    event.provider,
    event.identifier,
    false,
    event,
  );
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
): PromiseResult<WriteSession, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (!arg.subjectId) {
    return notOk.BadRequest('No subject provided');
  }
  return await databaseAdapter.authCreateSyncSessionForSubject(context, arg);
}

//TODO harmonize with core
function verifyAuthKeyFormat(authKey: string): Result<void, typeof ErrorType.BadRequest> {
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
  if (authKey === '') {
    return ok({ authKey: '', resolvedAuthKey: '' });
  }

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
  let authKeys =
    requestedAuthKeys && requestedAuthKeys.length > 0 ? requestedAuthKeys : context.defaultAuthKeys;
  if (authKeys.length === 0) {
    return notOk.BadRequest('No authKeys provided');
  }

  const defaultIndex = authKeys.indexOf('');
  if (defaultIndex !== -1) {
    if (authKeys.length === 1) {
      return ok([{ authKey: '', resolvedAuthKey: '' }]);
    }
    authKeys = authKeys.filter((it) => it !== '');
  }

  const verifyResult = verifyAuthKeysFormat(authKeys);
  if (verifyResult.isError()) return verifyResult;

  const resoledAuthKeysResult = await authorizationAdapter.resolveAuthorizationKeys(
    context,
    authKeys,
  );
  if (resoledAuthKeysResult.isError()) return resoledAuthKeysResult;
  const resoledAuthKeys = resoledAuthKeysResult.value;

  if (defaultIndex !== -1) {
    resoledAuthKeys.push({ authKey: '', resolvedAuthKey: '' });
  }
  return ok(resoledAuthKeys);
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
