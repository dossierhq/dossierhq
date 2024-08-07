import { vi, type MockInstance } from 'vitest';
import type { Logger } from '../Logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = MockInstance<TFn> & TFn;

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
