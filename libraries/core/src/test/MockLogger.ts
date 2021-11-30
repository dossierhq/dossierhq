import type { Logger } from '..';

export function createMockLogger(): {
  error: jest.MockedFunction<Logger['error']>;
  warn: jest.MockedFunction<Logger['warn']>;
  info: jest.MockedFunction<Logger['info']>;
  debug: jest.MockedFunction<Logger['debug']>;
} {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}
