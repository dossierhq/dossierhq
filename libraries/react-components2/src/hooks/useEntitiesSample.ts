import type {
  DossierClient,
  Entity,
  EntitySamplingOptions,
  EntitySamplingPayload,
  EntitySharedQuery,
  ErrorResult,
  ErrorType,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { DossierContext } from '../contexts/DossierContext.js';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<
  [string, EntitySharedQuery | undefined, EntitySamplingOptions | undefined]
>;
type FetcherData<T> = EntitySamplingPayload<T>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function useEntitiesSample<TEntity extends Entity<string, object>>(
  query: EntitySharedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): {
  entitiesSample: FetcherData<TEntity> | undefined;
  entitiesSampleError: FetcherError | undefined;
} {
  const { client } = useContext(DossierContext);
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) =>
      fetchEntitiesSample(client as DossierClient<TEntity>, query, options),
    [client],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.getEntitiesSample(query, options) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useEntitiesSample updated values', {
  //   client,
  //   query,
  //   options,
  //   data,
  //   error,
  // });
  return { entitiesSample: data, entitiesSampleError: error };
}

async function fetchEntitiesSample<TEntity extends Entity<string, object>>(
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
