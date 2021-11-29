import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, SessionContext } from '@jonasb/datadata-server';

export function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return {
    async resolveAuthorizationKeys<T extends string>(context: SessionContext, authKeys: T[]) {
      const result = {} as Record<T, string>;
      for (const key of authKeys) {
        let resolved: string = key;
        if (key === 'subject') {
          resolved = `subject:${context.session.subjectId}`;
        } else if (key === 'unauthorized') {
          return notOk.NotAuthorized(`User not authorized to use authKey ${key}`);
        } else if (key === 'non-existing') {
          return notOk.BadRequest(`The authKey ${key} doesn't exist`);
        }
        result[key] = resolved;
      }
      return ok(result);
    },
  };
}
