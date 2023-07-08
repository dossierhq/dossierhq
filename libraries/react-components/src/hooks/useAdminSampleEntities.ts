import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, AdminQuery | undefined, EntitySamplingOptions | undefined]>;
type FetcherData<T> = EntitySamplingPayload<T>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function useAdminSampleEntities<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined,
): {
  entitySamples: FetcherData<TAdminEntity> | undefined;
  entitySamplesError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) => fetchSampleEntities(adminClient, query, options),
    [adminClient],
  );
  const { data, error } = useSWR<FetcherData<TAdminEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminSampleEntities(query, options) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminSampleEntities updated values', {
  //   adminClient,
  //   query,
  //   options,
  //   data,
  //   error,
  // });
  return { entitySamples: data, entitySamplesError: error };
}

async function fetchSampleEntities<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  query: FetcherKey[1],
  options: FetcherKey[2],
): Promise<FetcherData<TAdminEntity>> {
  const result = await adminClient.sampleEntities(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
