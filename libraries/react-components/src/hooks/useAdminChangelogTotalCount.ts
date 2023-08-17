import type {
  AdminClient,
  AdminEntity,
  ChangelogQuery,
  ErrorResult,
  ErrorType,
  ValueItem,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, ChangelogQuery | undefined]>;
type FetcherData = number;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

export function useAdminChangelogTotalCount(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  query: ChangelogQuery | undefined,
): {
  totalCount: FetcherData | undefined;
  totalCountError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query]: FetcherKey) => fetchChangelogTotalCount(adminClient, query),
    [adminClient],
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminChangelogTotalCount(query) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminChangelogTotalCount changed values', { data, error });

  return { totalCount: data, totalCountError: error };
}

async function fetchChangelogTotalCount(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  query: FetcherKey[1],
): Promise<FetcherData> {
  const result = await adminClient.getChangelogTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
