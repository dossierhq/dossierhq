import type { ErrorType, PromiseResult, Result } from '../ErrorResult.js';
import { notOk, ok } from '../ErrorResult.js';
import type { Connection, Edge, Paging } from '../Types.js';

export interface PagingInfo {
  forwards: boolean;
  count: number | null;
}

export function getPagingInfo(
  paging: Paging | undefined,
): Result<PagingInfo, typeof ErrorType.BadRequest> {
  const result = validatePaging(paging);
  if (result.isError()) return result;

  const first = paging?.first;
  const last = paging?.last;
  const firstIsSet = typeof first === 'number';
  const lastIsSet = typeof last === 'number';

  const forwards = firstIsSet || !lastIsSet;

  let count: number | null = null;

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

export async function* getAllPagesForConnection<
  TEdge extends Edge<unknown, ErrorType>,
  TError extends ErrorType,
>(
  initialPaging: Paging | undefined,
  pageGenerator: (paging: Paging) => PromiseResult<Connection<TEdge> | null, TError>,
): AsyncGenerator<Result<Connection<TEdge>, TError>, undefined> {
  const currentPaging: Paging = { ...initialPaging };

  while (true) {
    const searchResult = await pageGenerator(currentPaging);
    if (searchResult.isError()) {
      yield searchResult;
      return;
    }
    if (!searchResult.value) {
      return;
    }
    yield ok(searchResult.value);

    const { pageInfo } = searchResult.value;
    const pagingInfo = getPagingInfo(currentPaging);
    const forwards = pagingInfo.isOk() ? pagingInfo.value.forwards : true;
    if (forwards) {
      if (pageInfo.hasNextPage) {
        currentPaging.after = pageInfo.endCursor;
      } else {
        return;
      }
    } else {
      if (pageInfo.hasPreviousPage) {
        currentPaging.before = pageInfo.startCursor;
      } else {
        return;
      }
    }
  }
}

export async function* getAllNodesForConnection<
  TEdge extends Edge<unknown, ErrorType>,
  TError extends ErrorType,
>(
  initialPaging: Paging | undefined,
  pageGenerator: (paging: Paging) => PromiseResult<Connection<TEdge> | null, TError>,
): AsyncGenerator<TEdge['node'], undefined> {
  for await (const pageResult of getAllPagesForConnection(initialPaging, pageGenerator)) {
    if (pageResult.isError()) {
      yield pageResult;
      return;
    }

    for (const edge of pageResult.value.edges) {
      yield edge.node;
    }
  }
}
