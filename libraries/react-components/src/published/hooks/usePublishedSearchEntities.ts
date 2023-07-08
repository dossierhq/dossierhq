import type {
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
  PublishedClient,
  PublishedEntity,
  PublishedSearchQuery,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, PublishedSearchQuery | undefined, Paging | undefined]>;
type FetcherData<T> = Connection<Edge<T, ErrorType>> | null;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @returns If no result, `connection` is `undefined`. If there are no matches, `connection` is `null`
 */
export function usePublishedSearchEntities<
  TPublishedEntity extends PublishedEntity<string, object>,
>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: PublishedSearchQuery | undefined,
  paging?: Paging,
): {
  connection: FetcherData<TPublishedEntity> | undefined;
  connectionError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, paging]: FetcherKey) => fetchSearchEntities(publishedClient, query, paging),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData<TPublishedEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedSearchEntities(query, paging) : null,
    fetcher,
  );

  // useDebugLogChangedValues('usePublishedSearchEntities updated values', { publishedClient, query, paging, data, error, });
  return { connection: data, connectionError: error };
}

async function fetchSearchEntities<TPublishedEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: FetcherKey[1],
  paging: FetcherKey[2],
): Promise<FetcherData<TPublishedEntity>> {
  const result = await publishedClient.searchEntities(query, paging);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
