import type {
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntity,
  PublishedQuery,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, PublishedQuery | undefined, EntitySamplingOptions | undefined]>;
type FetcherData = EntitySamplingPayload<PublishedEntity>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function usePublishedSampleEntities(
  publishedClient: PublishedClient,
  query: PublishedQuery | undefined,
  options?: EntitySamplingOptions
): {
  entitySamples: FetcherData | undefined;
  entitySamplesError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) => fetchSampleEntities(publishedClient, query, options),
    [publishedClient]
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedSampleEntities(query, options) : null,
    fetcher
  );

  // useDebugLogChangedValues('usePublishedSampleEntities updated values', { publishedClient, query, options, data, error, });
  return { entitySamples: data, entitySamplesError: error };
}

async function fetchSampleEntities(
  publishedClient: PublishedClient,
  query: FetcherKey[1],
  options: FetcherKey[2]
): Promise<FetcherData> {
  const result = await publishedClient.sampleEntities(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
