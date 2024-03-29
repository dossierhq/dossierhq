import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { ResolvedAuthKey } from '@dossierhq/database-adapter';
import type { SessionContext } from './Context.js';

export interface AuthorizationAdapter {
  resolveAuthorizationKeys(
    context: SessionContext,
    authKeys: readonly string[],
  ): PromiseResult<
    ResolvedAuthKey[],
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;
}

export const DefaultAuthorizationAdapter: AuthorizationAdapter = {
  resolveAuthorizationKeys(_context, authKeys) {
    for (const authKey of authKeys) {
      return Promise.resolve(notOk.BadRequest(`The authKey ${authKey} doesn't exist`));
    }
    return Promise.resolve(ok([]));
  },
};

export const SubjectAuthorizationAdapter: AuthorizationAdapter = {
  resolveAuthorizationKeys(context, authKeys) {
    const payload: ResolvedAuthKey[] = [];
    for (const authKey of authKeys) {
      let resolvedAuthKey: string;
      if (authKey === 'subject') {
        if (!context.session.subjectId) {
          continue;
        } else {
          resolvedAuthKey = `subject:${context.session.subjectId}`;
        }
      } else {
        return Promise.resolve(notOk.BadRequest(`The authKey ${authKey} doesn't exist`));
      }
      payload.push({ authKey, resolvedAuthKey });
    }
    return Promise.resolve(ok(payload));
  },
};
