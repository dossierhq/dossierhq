import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { ResolvedAuthKey } from '@jonasb/datadata-database-adapter';
import type { SessionContext } from './Context.js';

export interface AuthorizationAdapter {
  resolveAuthorizationKeys(
    context: SessionContext,
    authKeys: readonly string[]
  ): PromiseResult<
    ResolvedAuthKey[],
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >;
}

export const NoneAndSubjectAuthorizationAdapter: AuthorizationAdapter = {
  resolveAuthorizationKeys(
    context: SessionContext,
    authKeys: readonly string[]
  ): PromiseResult<
    ResolvedAuthKey[],
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  > {
    const result: ResolvedAuthKey[] = [];
    for (const authKey of authKeys) {
      let resolvedAuthKey: string;
      if (authKey === 'subject') {
        resolvedAuthKey = `subject:${context.session.subjectId}`;
      } else if (authKey === 'none') {
        resolvedAuthKey = 'none';
      } else {
        return Promise.resolve(notOk.BadRequest(`The authKey ${authKey} doesn't exist`));
      }
      result.push({ authKey, resolvedAuthKey });
    }
    return Promise.resolve(ok(result));
  },
};
