import type {
  DossierClient,
  Entity,
  ChangelogEvent,
  ChangelogEventQuery,
  Component,
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, ChangelogEventQuery | undefined, Paging | undefined]>;
type FetcherData = Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function useAdminChangelogEvents(
  client: DossierClient<Entity<string, object>, Component<string, object>>,
  query: ChangelogEventQuery | undefined,
  paging: Paging | undefined,
): {
  connection: FetcherData | undefined;
  connectionError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, paging]: FetcherKey) => fetchChangelogEvents(client, query, paging),
    [client],
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminChangelogEvents(query, paging) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminChangelogEvents changed values', { data, error });

  return { connection: data, connectionError: error };
}

async function fetchChangelogEvents(
  client: DossierClient<Entity<string, object>, Component<string, object>>,
  query: FetcherKey[1],
  paging: FetcherKey[2],
): Promise<FetcherData> {
  const result = await client.getChangelogEvents(query, paging);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
