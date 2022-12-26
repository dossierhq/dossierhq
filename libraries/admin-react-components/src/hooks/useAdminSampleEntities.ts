import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, AdminQuery | undefined, EntitySamplingOptions | undefined]>;
type FetcherData = EntitySamplingPayload<AdminEntity>;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function useAdminSampleEntities(
  adminClient: AdminClient,
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined
): {
  entitySamples: FetcherData | undefined;
  entitySamplesError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, options]: FetcherKey) => fetchSampleEntities(adminClient, query, options),
    [adminClient]
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminSampleEntities(query, options) : null,
    fetcher
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

async function fetchSampleEntities(
  adminClient: AdminClient,
  query: FetcherKey[1],
  options: FetcherKey[2]
): Promise<FetcherData> {
  const result = await adminClient.sampleEntities(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
