import {
  PublishedSchema,
  type Component,
  type ErrorResult,
  type ErrorType,
  type PublishedDossierClient,
  type PublishedEntity,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { PublishedDossierContext } from '../contexts/PublishedDossierContext.js';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = string;
type FetcherData = PublishedSchema;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function usePublishedSchema(enabled = true): {
  schema: FetcherData | undefined;
  schemaError: FetcherError | undefined;
} {
  const { publishedClient } = useContext(PublishedDossierContext);
  const fetcher = useCallback(
    (_action: FetcherKey) => fetchSchema(publishedClient),
    [publishedClient],
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    enabled ? CACHE_KEYS.publishedSchema : null,
    fetcher,
  );

  return { schema: data, schemaError: error };
}

async function fetchSchema(
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >,
): Promise<FetcherData> {
  const result = await publishedClient.getSchemaSpecification();
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return new PublishedSchema(result.value);
}
