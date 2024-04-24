import type {
  DossierClient,
  EntityQuery,
  Entity,
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
 * @param client
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @returns If no result, `connection` is `undefined`. If there are no matches, `connection` is `null`
 */
export function useAdminEntities<TEntity extends Entity<string, object>>(
  client: DossierClient<TEntity>,
  query: EntityQuery | undefined,
  paging?: Paging,
): {
  connection: FetcherData<TEntity> | undefined;
  connectionError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, query, paging]: FetcherKey) => fetchGetEntities(client, query, paging),
    [client],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.adminEntities(query, paging) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminEntities updated values', {
  //   client,
  //   query,
  //   paging,
  //   data,
  //   error,
  // });
  return { connection: data, connectionError: error };
}

async function fetchGetEntities<TEntity extends Entity<string, object>>(
  client: DossierClient<TEntity>,
  query: FetcherKey[1],
  paging: FetcherKey[2],
): Promise<FetcherData<TEntity>> {
  const result = await client.getEntities(query, paging);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
