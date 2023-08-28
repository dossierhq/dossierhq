import type {
  AdminClient,
  AdminEntity,
  ChangelogEventQuery,
  ErrorResult,
  ErrorType,
  ValueItem,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, ChangelogEventQuery | undefined]>;
type FetcherData = number;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

export function useAdminChangelogEventsTotalCount(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  query: ChangelogEventQuery | undefined,
): {
  totalCount: FetcherData | undefined;
  totalCountError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query]: FetcherKey) => fetchChangelogEventsTotalCount(adminClient, query),
    [adminClient],
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminChangelogEventsTotalCount(query) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminChangelogEventsTotalCount changed values', { data, error });

  return { totalCount: data, totalCountError: error };
}

async function fetchChangelogEventsTotalCount(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  query: FetcherKey[1],
): Promise<FetcherData> {
  const result = await adminClient.getChangelogEventsTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
