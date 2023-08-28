import type {
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntitiesSharedQuery,
  PublishedEntity,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = Readonly<
  [string, PublishedEntitiesSharedQuery | undefined, EntitySamplingOptions | undefined]
>;
type FetcherData<T> = EntitySamplingPayload<T>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function usePublishedEntitiesSample<
  TPublishedEntity extends PublishedEntity<string, object>,
>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: PublishedEntitiesSharedQuery | undefined,
  options?: EntitySamplingOptions,
): {
  entitiesSample: FetcherData<TPublishedEntity> | undefined;
  entitiesSampleError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) => fetchEntitiesSample(publishedClient, query, options),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData<TPublishedEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedEntitiesSample(query, options) : null,
    fetcher,
  );

  // useDebugLogChangedValues('usePublishedEntitiesSample updated values', { publishedClient, query, options, data, error, });
  return { entitiesSample: data, entitiesSampleError: error };
}

async function fetchEntitiesSample<TPublishedEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: FetcherKey[1],
  options: FetcherKey[2],
): Promise<FetcherData<TPublishedEntity>> {
  const result = await publishedClient.getEntitiesSample(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
