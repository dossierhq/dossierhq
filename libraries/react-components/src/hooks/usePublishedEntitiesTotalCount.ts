import type {
  Component,
  ErrorResult,
  ErrorType,
  PublishedDossierClient,
  PublishedEntity,
  PublishedEntitySharedQuery,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, PublishedEntitySharedQuery | undefined]>;
type FetcherData = number;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @returns If no result, `connection` is `undefined`.
 */
export function usePublishedEntitiesTotalCount(
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >,
  query: PublishedEntitySharedQuery | undefined,
): {
  totalCount: FetcherData | undefined;
  totalCountError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query]: FetcherKey) => fetchEntitiesTotalCount(publishedClient, query),
    [publishedClient],
  );
  const { data: totalCount, error: totalCountError } = useSWR<
    FetcherData,
    FetcherError,
    FetcherKey | null
  >(query ? CACHE_KEYS.publishedEntitiesTotalCount(query) : null, fetcher);

  // useDebugLogChangedValues('usePublishedEntitiesTotalCount updated values', { publishedClient, query, totalCount, totalCountError, });

  return { totalCount, totalCountError };
}

async function fetchEntitiesTotalCount(
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >,
  query: FetcherKey[1],
): Promise<FetcherData> {
  const result = await publishedClient.getEntitiesTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
