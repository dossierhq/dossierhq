import type {
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedQuery,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @returns If no result, `connection` is `undefined`.
 */
export function usePublishedTotalCount(
  publishedClient: PublishedClient,
  query: PublishedQuery | undefined
): {
  totalCount: number | undefined;
  totalCountError:
    | ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
    | undefined;
} {
  const fetcher = useCallback(
    (_action: string, paramsJson: string) => {
      const query = JSON.parse(paramsJson) as PublishedQuery;
      return fetchTotalCount(publishedClient, query);
    },
    [publishedClient]
  );
  const { data: totalCount, error: totalCountError } = useSWR(
    query ? ['datadata/usePublishedTotalCount', JSON.stringify(query)] : null,
    fetcher
  );

  // useDebugLogChangedValues('usePublishedTotalCount updated values', { publishedClient, query, totalCount, totalCountError, });

  return { totalCount, totalCountError };
}

async function fetchTotalCount(
  publishedClient: PublishedClient,
  query: PublishedQuery
): Promise<number> {
  const result = await publishedClient.getTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
