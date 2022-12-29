import type {
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntity,
  PublishedQuery,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

type FetcherKey = Readonly<[string, PublishedQuery | undefined]>;
type FetcherData = number;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @returns If no result, `connection` is `undefined`.
 */
export function usePublishedTotalCount(
  publishedClient: PublishedClient<PublishedEntity<string, object>>,
  query: PublishedQuery | undefined
): {
  totalCount: FetcherData | undefined;
  totalCountError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query]: FetcherKey) => fetchTotalCount(publishedClient, query),
    [publishedClient]
  );
  const { data: totalCount, error: totalCountError } = useSWR<
    FetcherData,
    FetcherError,
    FetcherKey | null
  >(query ? ['datadata/usePublishedTotalCount', query] : null, fetcher);

  // useDebugLogChangedValues('usePublishedTotalCount updated values', { publishedClient, query, totalCount, totalCountError, });

  return { totalCount, totalCountError };
}

async function fetchTotalCount(
  publishedClient: PublishedClient<PublishedEntity<string, object>>,
  query: FetcherKey[1]
): Promise<FetcherData> {
  const result = await publishedClient.getTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
