export function assertExhaustive(param: never): never {
  throw new Error(`Invalid exhaustiveness check: ${param}`);
}
