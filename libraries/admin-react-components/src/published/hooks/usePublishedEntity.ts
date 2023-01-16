import type {
  EntityReference,
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntity,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference]>;
type FetcherData<T> = T;
type FetcherError = ErrorResult<unknown, typeof ErrorType.NotFound | typeof ErrorType.Generic>;

export function usePublishedEntity<TPublishedEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedClient<TPublishedEntity>,
  reference: EntityReference | undefined
): {
  entity: FetcherData<TPublishedEntity> | undefined;
  entityError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchEntity(publishedClient, reference),
    [publishedClient]
  );
  const { data, error } = useSWR<FetcherData<TPublishedEntity>, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.publishedEntity(reference) : null,
    fetcher
  );

  return { entity: data, entityError: error };
}

async function fetchEntity<TPublishedEntity extends PublishedEntity<string, object>>(
  publishedClient: PublishedClient<TPublishedEntity>,
  reference: FetcherKey[1]
): Promise<FetcherData<TPublishedEntity>> {
  const result = await publishedClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
