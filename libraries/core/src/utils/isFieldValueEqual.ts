// TODO not sure about this one. Change to isEqual()? Or at least split if we want null and undefined to be equal?

export function isFieldValueEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  if (a === null || a === undefined || b === null || b === undefined) {
    return false; // if a or be are not defined they can't be equal
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!isFieldValueEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === 'object') {
    if (typeof b !== 'object' || a === null || b === null) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (
        !isFieldValueEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}
