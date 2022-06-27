import type { Logger } from '@jonasb/datadata-core';
import type { SpyInstance } from 'vitest';
import { vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = SpyInstance<
  Parameters<TFn>,
  ReturnType<TFn>
> &
  TFn;

export function createMockLogger(): {
  error: MockedFunction<Logger['error']>;
  warn: MockedFunction<Logger['warn']>;
  info: MockedFunction<Logger['info']>;
  debug: MockedFunction<Logger['debug']>;
} {
  return {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
}
