import type {
  EntityReference,
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntity,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference]>;
type FetcherData = PublishedEntity;
type FetcherError = ErrorResult<unknown, typeof ErrorType.NotFound | typeof ErrorType.Generic>;

export function usePublishedEntity(
  publishedClient: PublishedClient,
  reference: EntityReference | undefined
): {
  entity: FetcherData | undefined;
  entityError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchEntity(publishedClient, reference),
    [publishedClient]
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.publishedEntity(reference) : null,
    fetcher
  );

  return { entity: data, entityError: error };
}

async function fetchEntity(
  publishedClient: PublishedClient,
  reference: FetcherKey[1]
): Promise<FetcherData> {
  const result = await publishedClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
