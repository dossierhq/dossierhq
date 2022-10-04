import type { ErrorResult, ErrorType, PublishedClient } from '@jonasb/datadata-core';
import { PublishedSchema } from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../../utils/CacheUtils.js';

export function usePublishedSchema(publishedClient: PublishedClient): {
  schema: PublishedSchema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback((_action: string) => fetchSchema(publishedClient), [publishedClient]);
  const { data, error } = useSWR(CACHE_KEYS.publishedSchema, fetcher);

  // useDebugLogChangedValues('usePublishedSchema changed values', { data, error });

  return { schema: data, schemaError: error };
}

async function fetchSchema(publishedClient: PublishedClient): Promise<PublishedSchema> {
  const result = await publishedClient.getSchemaSpecification();
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return new PublishedSchema(result.value);
}
