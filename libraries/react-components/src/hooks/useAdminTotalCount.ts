import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  ErrorResult,
  ErrorType,
  ValueItem,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, AdminQuery | undefined]>;
type FetcherData = number;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @returns If no result, `connection` is `undefined`.
 */
export function useAdminTotalCount(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  query: AdminQuery | undefined,
): {
  totalCount: FetcherData | undefined;
  totalCountError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query]: FetcherKey) => fetchTotalCount(adminClient, query),
    [adminClient],
  );
  const { data: totalCount, error: totalCountError } = useSWR<
    FetcherData,
    FetcherError,
    FetcherKey | null
  >(query ? CACHE_KEYS.adminTotalCount(query) : null, fetcher);

  // useDebugLogChangedValues('useAdminTotalCount updated values', { adminClient, query, totalCount, totalCountError, });

  return { totalCount, totalCountError };
}

async function fetchTotalCount(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  query: FetcherKey[1],
): Promise<FetcherData> {
  const result = await adminClient.getTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
