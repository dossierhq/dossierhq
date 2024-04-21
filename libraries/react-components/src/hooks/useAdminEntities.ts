import type {
  AdminClient,
  EntityQuery,
  AdminEntity,
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityQuery | undefined, Paging | undefined]>;
type FetcherData<T> = Connection<Edge<T, ErrorType>> | null;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @returns If no result, `connection` is `undefined`. If there are no matches, `connection` is `null`
 */
export function useAdminEntities<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  query: EntityQuery | undefined,
  paging?: Paging,
): {
  connection: FetcherData<TAdminEntity> | undefined;
  connectionError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, paging]: FetcherKey) => fetchGetEntities(adminClient, query, paging),
    [adminClient],
  );
  const { data, error } = useSWR<FetcherData<TAdminEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminEntities(query, paging) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminEntities updated values', {
  //   adminClient,
  //   query,
  //   paging,
  //   data,
  //   error,
  // });
  return { connection: data, connectionError: error };
}

async function fetchGetEntities<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  query: FetcherKey[1],
  paging: FetcherKey[2],
): Promise<FetcherData<TAdminEntity>> {
  const result = await adminClient.getEntities(query, paging);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
