import { ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter } from '@jonasb/datadata-server';

export function createTestAuthorizationAdapter(): AuthorizationAdapter {
  return {
    async resolveAuthorizationKeys<T extends string>(authKeys: T[]) {
      const result = {} as Record<T, string>;
      for (const key of authKeys) {
        result[key] = key;
      }
      return ok(result);
    },
  };
}
