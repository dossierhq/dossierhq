import type {
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
  PublishedDossierClient,
  PublishedEntity,
  PublishedEntitySharedQuery,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { PublishedDossierContext } from '../contexts/PublishedDossierContext.js';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<
  [string, PublishedEntitySharedQuery | undefined, EntitySamplingOptions | undefined]
>;
type FetcherData<T> = EntitySamplingPayload<T>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param query If `undefined`, no data is fetched
 */
export function usePublishedEntitiesSample<
  TEntity extends PublishedEntity<string, object> = PublishedEntity,
>(
  query: PublishedEntitySharedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): {
  entitiesSample: FetcherData<TEntity> | undefined;
  entitiesSampleError: FetcherError | undefined;
} {
  const { publishedClient } = useContext(PublishedDossierContext);
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) =>
      fetchEntitiesSample(publishedClient as PublishedDossierClient<TEntity>, query, options),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedGetEntitiesSample(query, options) : null,
    fetcher,
  );

  return { entitiesSample: data, entitiesSampleError: error };
}

async function fetchEntitiesSample<TEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedDossierClient<TEntity>,
  query: FetcherKey[1],
  options: FetcherKey[2],
): Promise<FetcherData<TEntity>> {
  const result = await publishedClient.getEntitiesSample(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
