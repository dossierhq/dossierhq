class AssertionError extends Error {
  actual: unknown;

  constructor(actual: unknown, message: string) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
  }
}

export function assertTruthy(actual: unknown): asserts actual {
  if (!actual) {
    throw new AssertionError(actual, `Expected truthy`);
  }
}

export function assertSame<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new AssertionError(actual, `Expected same, got ${actual} !== ${expected}`);
  }
}
