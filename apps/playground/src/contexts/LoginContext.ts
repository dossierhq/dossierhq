import { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { createContext } from 'react';

export type LoginContextValue = (
  userId: string
) => PromiseResult<void, ErrorType.BadRequest | ErrorType.Generic>;

export const LoginContext = createContext<LoginContextValue>({
  defaultLoginContentValue: true,
} as unknown as LoginContextValue);
