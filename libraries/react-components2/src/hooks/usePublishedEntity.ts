import type {
  EntityReference,
  ErrorResult,
  ErrorType,
  PublishedDossierClient,
  PublishedEntity,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { PublishedDossierContext } from '../contexts/PublishedDossierContext.js';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference]>;
type FetcherData<T> = T;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function usePublishedEntity<
  TEntity extends PublishedEntity<string, object> = PublishedEntity,
>(
  reference: EntityReference | undefined,
): {
  entity: FetcherData<TEntity> | undefined;
  entityError: FetcherError | undefined;
} {
  const { publishedClient } = useContext(PublishedDossierContext);
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) =>
      fetchEntity(publishedClient as PublishedDossierClient<TEntity>, reference),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.publishedGetEntity(reference) : null,
    fetcher,
  );

  return { entity: data, entityError: error };
}

async function fetchEntity<TEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedDossierClient<TEntity>,
  reference: EntityReference,
): Promise<FetcherData<TEntity>> {
  const result = await publishedClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
