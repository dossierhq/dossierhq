import { ok } from '@jonasb/datadata-core';
import type { AuthenticationAdapter } from '@jonasb/datadata-server';

export function createTestAuthenticationAdapter(): AuthenticationAdapter {
  return {
    async resolveAuthenticationKeys<T extends string>(authKeys: T[]) {
      const result = {} as Record<T, string>;
      for (const key of authKeys) {
        result[key] = key;
      }
      return ok(result);
    },
  };
}
