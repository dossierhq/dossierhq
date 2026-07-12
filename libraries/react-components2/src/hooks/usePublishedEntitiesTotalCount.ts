import type {
  Component,
  ErrorResult,
  ErrorType,
  PublishedDossierClient,
  PublishedEntity,
  PublishedEntitySharedQuery,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { PublishedDossierContext } from '../contexts/PublishedDossierContext.js';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, PublishedEntitySharedQuery | undefined]>;
type FetcherData = number;
type FetcherError = ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

export function usePublishedEntitiesTotalCount(query: PublishedEntitySharedQuery | undefined): {
  totalCount: FetcherData | undefined;
  totalCountError: FetcherError | undefined;
} {
  const { publishedClient } = useContext(PublishedDossierContext);
  const fetcher = useCallback(
    ([_action, query]: FetcherKey) => fetchEntitiesTotalCount(publishedClient, query),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    query ? CACHE_KEYS.publishedGetEntitiesTotalCount(query) : null,
    fetcher,
  );

  return { totalCount: data, totalCountError: error };
}

async function fetchEntitiesTotalCount(
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >,
  query: FetcherKey[1],
): Promise<FetcherData> {
  const result = await publishedClient.getEntitiesTotalCount(query);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
