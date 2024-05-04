import type {
  DossierClient,
  Entity,
  EntitySamplingOptions,
  EntitySamplingPayload,
  EntitySharedQuery,
  ErrorResult,
  ErrorType,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<
  [string, EntitySharedQuery | undefined, EntitySamplingOptions | undefined]
>;
type FetcherData<T> = EntitySamplingPayload<T>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param client
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function useAdminEntitiesSample<TEntity extends Entity<string, object>>(
  client: DossierClient<TEntity>,
  query: EntitySharedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): {
  entitiesSample: FetcherData<TEntity> | undefined;
  entitiesSampleError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) => fetchSampleEntities(client, query, options),
    [client],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminEntitiesSample(query, options) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminEntitiesSample updated values', {
  //   client,
  //   query,
  //   options,
  //   data,
  //   error,
  // });
  return { entitiesSample: data, entitiesSampleError: error };
}

async function fetchSampleEntities<TEntity extends Entity<string, object>>(
  client: DossierClient<TEntity>,
  query: FetcherKey[1],
  options: FetcherKey[2],
): Promise<FetcherData<TEntity>> {
  const result = await client.getEntitiesSample(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
