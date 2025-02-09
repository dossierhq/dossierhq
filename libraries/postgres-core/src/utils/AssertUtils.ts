export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(
      `Expected 'val' to be defined, but received ${val === undefined ? 'undefined' : 'null'}`,
    );
  }
}

export function assertExhaustive(param: never): never {
  throw new Error(`Invalid exhaustiveness check: ${param}`);
}
