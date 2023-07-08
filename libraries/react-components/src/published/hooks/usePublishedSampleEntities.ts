import type {
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntity,
  PublishedQuery,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, PublishedQuery | undefined, EntitySamplingOptions | undefined]>;
type FetcherData<T> = EntitySamplingPayload<T>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function usePublishedSampleEntities<
  TPublishedEntity extends PublishedEntity<string, object>,
>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: PublishedQuery | undefined,
  options?: EntitySamplingOptions,
): {
  entitySamples: FetcherData<TPublishedEntity> | undefined;
  entitySamplesError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) => fetchSampleEntities(publishedClient, query, options),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData<TPublishedEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedSampleEntities(query, options) : null,
    fetcher,
  );

  // useDebugLogChangedValues('usePublishedSampleEntities updated values', { publishedClient, query, options, data, error, });
  return { entitySamples: data, entitySamplesError: error };
}

async function fetchSampleEntities<TPublishedEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedClient<TPublishedEntity>,
  query: FetcherKey[1],
  options: FetcherKey[2],
): Promise<FetcherData<TPublishedEntity>> {
  const result = await publishedClient.sampleEntities(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
