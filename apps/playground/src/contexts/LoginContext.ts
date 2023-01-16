import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { createContext } from 'react';

export type LoginContextValue = (
  userId: string
) => PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

export const LoginContext = createContext<LoginContextValue>({
  defaultLoginContentValue: true,
} as unknown as LoginContextValue);
