import type {
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntity,
  PublishedQuery,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function usePublishedSampleEntities(
  publishedClient: PublishedClient,
  query: PublishedQuery | undefined,
  options?: EntitySamplingOptions
): {
  entitySamples: EntitySamplingPayload<PublishedEntity> | undefined;
  entitySamplesError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback(
    (_action: string, paramsJson: string) => {
      const { query, options } = JSON.parse(paramsJson) as {
        query: PublishedQuery;
        options: EntitySamplingOptions | undefined;
      };
      return fetchSampleEntities(publishedClient, query, options);
    },
    [publishedClient]
  );
  const { data, error } = useSWR(
    query ? ['datadata/usePublishedSampleEntities', JSON.stringify({ query, options })] : null,
    fetcher
  );

  // useDebugLogChangedValues('usePublishedSampleEntities updated values', { publishedClient, query, options, data, error, });
  return { entitySamples: data, entitySamplesError: error };
}

async function fetchSampleEntities(
  publishedClient: PublishedClient,
  query: PublishedQuery,
  options: EntitySamplingOptions | undefined
): Promise<EntitySamplingPayload<PublishedEntity>> {
  const result = await publishedClient.sampleEntities(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
