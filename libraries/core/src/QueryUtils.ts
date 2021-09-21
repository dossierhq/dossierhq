import type { ErrorType, Paging, Result } from '.';
import { notOk, ok } from '.';

export function getPagingInfo(
  paging: Paging | undefined
): Result<{ forwards: boolean; count: number | null }, ErrorType.BadRequest> {
  const result = validatePaging(paging);
  if (result.isError()) {
    return result;
  }

  const first = paging?.first;
  const last = paging?.last;
  const firstIsSet = typeof first === 'number';
  const lastIsSet = typeof last === 'number';

  const forwards = firstIsSet || !lastIsSet;

  let count = null;

  if (firstIsSet) {
    count = first;
  } else if (lastIsSet) {
    count = last;
  }

  return ok({ forwards, count });
}

function validatePaging(paging?: Paging | undefined) {
  if (paging) {
    const { first, last } = paging;
    if (typeof first === 'number' && first < 0) {
      return notOk.BadRequest('Paging first is a negative value');
    }
    if (typeof last === 'number' && last < 0) {
      return notOk.BadRequest('Paging last is a negative value');
    }
    if (typeof first === 'number' && typeof last === 'number') {
      // Valid in spec but discouraged. How to implement?
      return notOk.BadRequest('Both first and last are defined for paging, which is not supported');
    }
  }
  return ok(undefined);
}
