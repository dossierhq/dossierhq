import type { ErrorResult, ErrorType, PublishedClient, PublishedEntity } from '@dossierhq/core';
import { PublishedSchema } from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

type FetcherKey = string;
type FetcherData = PublishedSchema;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function usePublishedSchema(
  publishedClient: PublishedClient<PublishedEntity<string, object>>
): {
  schema: FetcherData | undefined;
  schemaError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    (_action: FetcherKey) => fetchSchema(publishedClient),
    [publishedClient]
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey>(
    CACHE_KEYS.publishedSchema,
    fetcher
  );

  // useDebugLogChangedValues('usePublishedSchema changed values', { data, error });

  return { schema: data, schemaError: error };
}

async function fetchSchema(
  publishedClient: PublishedClient<PublishedEntity<string, object>>
): Promise<FetcherData> {
  const result = await publishedClient.getSchemaSpecification();
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return new PublishedSchema(result.value);
}
