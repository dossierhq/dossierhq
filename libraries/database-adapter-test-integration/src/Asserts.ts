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
