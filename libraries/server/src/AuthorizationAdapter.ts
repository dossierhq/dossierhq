import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { SessionContext } from '.';

export interface AuthorizationAdapter {
  resolveAuthorizationKeys<T extends string>(
    context: SessionContext,
    authKeys: readonly T[]
  ): PromiseResult<
    Record<T, string>,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >;
}
