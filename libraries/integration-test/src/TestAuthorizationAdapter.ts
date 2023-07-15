import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type { AuthorizationAdapter, ResolvedAuthKey, SessionContext } from '@dossierhq/server';

export function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return {
    resolveAuthorizationKeys(
      context: SessionContext,
      authKeys: readonly string[],
    ): PromiseResult<
      ResolvedAuthKey[],
      typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
    > {
      const result: ResolvedAuthKey[] = [];
      for (const authKey of authKeys) {
        let resolvedAuthKey: string = authKey;
        if (authKey === 'subject') {
          resolvedAuthKey = `subject:${context.session.subjectId}`;
        } else if (authKey === 'unauthorized') {
          return Promise.resolve(
            notOk.NotAuthorized(`User not authorized to use authKey ${authKey}`),
          );
        } else if (authKey === 'non-existing') {
          return Promise.resolve(notOk.BadRequest(`The authKey ${authKey} doesn't exist`));
        }
        result.push({ authKey, resolvedAuthKey });
      }
      return Promise.resolve(ok(result));
    },
  };
}
