import type {
  AdminClient,
  Entity,
  EntitySharedQuery,
  Component,
  ErrorResult,
  ErrorType,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntitySharedQuery | undefined]>;
type FetcherData = number;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @returns If no result, `connection` is `undefined`.
 */
export function useAdminEntitiesTotalCount(
  adminClient: AdminClient<Entity<string, object>, Component<string, object>>,
  query: EntitySharedQuery | undefined,
): {
  totalCount: FetcherData | undefined;
  totalCountError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query]: FetcherKey) => fetchEntitiesTotalCount(adminClient, query),
    [adminClient],
  );
  const { data: totalCount, error: totalCountError } = useSWR<
    FetcherData,
    FetcherError,
    FetcherKey | null
  >(query ? CACHE_KEYS.adminEntitiesTotalCount(query) : null, fetcher);

  // useDebugLogChangedValues('useAdminEntitiesTotalCount updated values', { adminClient, query, totalCount, totalCountError, });

  return { totalCount, totalCountError };
}

async function fetchEntitiesTotalCount(
  adminClient: AdminClient<Entity<string, object>, Component<string, object>>,
  query: FetcherKey[1],
): Promise<FetcherData> {
  const result = await adminClient.getEntitiesTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
