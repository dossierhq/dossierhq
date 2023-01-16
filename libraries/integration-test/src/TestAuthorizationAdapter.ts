import { notOk, ok } from '@dossierhq/core';
import type { AuthorizationAdapter, ResolvedAuthKey, SessionContext } from '@dossierhq/server';

export function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return {
    async resolveAuthorizationKeys(context: SessionContext, authKeys: readonly string[]) {
      const result: ResolvedAuthKey[] = [];
      for (const authKey of authKeys) {
        let resolvedAuthKey: string = authKey;
        if (authKey === 'subject') {
          resolvedAuthKey = `subject:${context.session.subjectId}`;
        } else if (authKey === 'unauthorized') {
          return notOk.NotAuthorized(`User not authorized to use authKey ${authKey}`);
        } else if (authKey === 'non-existing') {
          return notOk.BadRequest(`The authKey ${authKey} doesn't exist`);
        }
        result.push({ authKey, resolvedAuthKey });
      }
      return ok(result);
    },
  };
}
