import type {
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
  PublishedClient,
  PublishedEntityQuery,
  PublishedEntity,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, PublishedEntityQuery | undefined, Paging | undefined]>;
type FetcherData<T> = Connection<Edge<T, ErrorType>> | null;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @returns If no result, `connection` is `undefined`. If there are no matches, `connection` is `null`
 */
export function usePublishedEntities<TPublishedEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: PublishedEntityQuery | undefined,
  paging?: Paging,
): {
  connection: FetcherData<TPublishedEntity> | undefined;
  connectionError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, paging]: FetcherKey) => fetchEntities(publishedClient, query, paging),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData<TPublishedEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedEntities(query, paging) : null,
    fetcher,
  );

  // useDebugLogChangedValues('usePublishedEntities updated values', { publishedClient, query, paging, data, error, });
  return { connection: data, connectionError: error };
}

async function fetchEntities<TPublishedEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: FetcherKey[1],
  paging: FetcherKey[2],
): Promise<FetcherData<TPublishedEntity>> {
  const result = await publishedClient.getEntities(query, paging);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
