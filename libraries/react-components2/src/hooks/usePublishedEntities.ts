import type {
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
  PublishedDossierClient,
  PublishedEntity,
  PublishedEntityQuery,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { PublishedDossierContext } from '../contexts/PublishedDossierContext.js';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, PublishedEntityQuery | undefined, Paging | undefined]>;
type FetcherData<T> = Connection<Edge<T, ErrorType>> | null;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

/**
 * @param query If `undefined`, no data is fetched
 */
export function usePublishedEntities<
  TEntity extends PublishedEntity<string, object> = PublishedEntity,
>(
  query: PublishedEntityQuery | undefined,
  paging?: Paging,
): {
  connection: FetcherData<TEntity> | undefined;
  connectionError: FetcherError | undefined;
} {
  const { publishedClient } = useContext(PublishedDossierContext);
  const fetcher = useCallback(
    ([_action, query, paging]: FetcherKey) =>
      fetchGetEntities(publishedClient as PublishedDossierClient<TEntity>, query, paging),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedGetEntities(query, paging) : null,
    fetcher,
  );

  return { connection: data, connectionError: error };
}

async function fetchGetEntities<TEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedDossierClient<TEntity>,
  query: FetcherKey[1],
  paging: FetcherKey[2],
): Promise<FetcherData<TEntity>> {
  const result = await publishedClient.getEntities(query, paging);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
