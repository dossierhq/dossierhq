import type { AdminClient, AdminQuery, ErrorResult, ErrorType } from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @returns If no result, `connection` is `undefined`.
 */
export function useAdminTotalCount(
  adminClient: AdminClient,
  query: AdminQuery | undefined
): {
  totalCount: number | undefined;
  totalCountError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback(
    (_action: string, paramsJson: string) => {
      const query = JSON.parse(paramsJson) as AdminQuery;
      return fetchTotalCount(adminClient, query);
    },
    [adminClient]
  );
  const { data: totalCount, error: totalCountError } = useSWR(
    query ? ['datadata/useAdminTotalCount', JSON.stringify(query)] : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminTotalCount updated values', { adminClient, query, totalCount, totalCountError, });

  return { totalCount, totalCountError };
}

async function fetchTotalCount(adminClient: AdminClient, query: AdminQuery): Promise<number> {
  const result = await adminClient.getTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
