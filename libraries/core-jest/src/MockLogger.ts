import type { Logger } from '@jonasb/datadata-core';

interface MockLogger {
  error: jest.MockedFunction<Logger['error']>;
  warn: jest.MockedFunction<Logger['warn']>;
  info: jest.MockedFunction<Logger['info']>;
  debug: jest.MockedFunction<Logger['debug']>;
}

export function createMockLogger(): MockLogger {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}
