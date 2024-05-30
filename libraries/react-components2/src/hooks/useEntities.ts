import type {
  Connection,
  DossierClient,
  Edge,
  Entity,
  EntityQuery,
  ErrorResult,
  ErrorType,
  Paging,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { DossierContext } from '../contexts/DossierContext.js';
import { CACHE_KEYS } from '../lib/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityQuery | undefined, Paging | undefined]>;
type FetcherData<T> = Connection<Edge<T, ErrorType>> | null;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @returns If no result, `connection` is `undefined`. If there are no matches, `connection` is `null`
 */
export function useEntities<TEntity extends Entity<string, object> = Entity>(
  query: EntityQuery | undefined,
  paging?: Paging,
): {
  connection: FetcherData<TEntity> | undefined;
  connectionError: FetcherError | undefined;
} {
  const { client } = useContext(DossierContext);
  const fetcher = useCallback(
    ([_action, query, paging]: FetcherKey) =>
      fetchGetEntities(client as DossierClient<TEntity>, query, paging),
    [client],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.entities(query, paging) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useEntities updated values', {
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
