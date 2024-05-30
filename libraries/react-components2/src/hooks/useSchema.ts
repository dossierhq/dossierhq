import {
  SchemaWithMigrations,
  type Component,
  type DossierClient,
  type Entity,
  type ErrorResult,
  type ErrorType,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { DossierContext } from '../contexts/DossierContext.js';
import { CACHE_KEYS } from '../lib/CacheUtils.js';

type FetcherKey = string;
type FetcherData = SchemaWithMigrations;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function useSchema(): {
  schema: FetcherData | undefined;
  schemaError: FetcherError | undefined;
} {
  const { client } = useContext(DossierContext);
  const fetcher = useCallback((_action: FetcherKey) => fetchSchema(client), [client]);
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey>(CACHE_KEYS.schema, fetcher);

  // useDebugLogChangedValues('useSchema changed values', { data, error });

  return { schema: data, schemaError: error };
}

async function fetchSchema(
  client: DossierClient<Entity<string, object>, Component<string, object>>,
): Promise<FetcherData> {
  const result = await client.getSchemaSpecification({
    includeMigrations: true,
  });
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return new SchemaWithMigrations(result.value);
}
