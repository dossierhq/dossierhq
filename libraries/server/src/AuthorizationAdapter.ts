import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';

export interface AuthorizationAdapter {
  resolveAuthorizationKeys<T extends string>(
    authKeys: T[]
  ): PromiseResult<
    Record<T, string>,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;
}
