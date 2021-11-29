import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';

export interface AuthenticationAdapter {
  resolveAuthenticationKeys<T extends string>(
    authKeys: T[]
  ): PromiseResult<
    Record<T, string>,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;
}
