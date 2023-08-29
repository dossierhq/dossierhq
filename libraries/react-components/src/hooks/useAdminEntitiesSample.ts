import type {
  AdminClient,
  AdminEntitySharedQuery,
  AdminEntity,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<
  [string, AdminEntitySharedQuery | undefined, EntitySamplingOptions | undefined]
>;
type FetcherData<T> = EntitySamplingPayload<T>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function useAdminEntitiesSample<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  query: AdminEntitySharedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): {
  entitiesSample: FetcherData<TAdminEntity> | undefined;
  entitiesSampleError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) => fetchSampleEntities(adminClient, query, options),
    [adminClient],
  );
  const { data, error } = useSWR<FetcherData<TAdminEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminEntitiesSample(query, options) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminEntitiesSample updated values', {
  //   adminClient,
  //   query,
  //   options,
  //   data,
  //   error,
  // });
  return { entitiesSample: data, entitiesSampleError: error };
}

async function fetchSampleEntities<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  query: FetcherKey[1],
  options: FetcherKey[2],
): Promise<FetcherData<TAdminEntity>> {
  const result = await adminClient.getEntitiesSample(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
