import { createContext, type Context } from 'react';

export function createClientContext<T>(defaultValue: T | undefined): Context<T> {
  // When on server, return undefined since we can't use contexts on e.g. Next.js server components
  if (typeof createContext === 'undefined') return undefined as unknown as Context<T>;
  return createContext(defaultValue as unknown as T);
}
