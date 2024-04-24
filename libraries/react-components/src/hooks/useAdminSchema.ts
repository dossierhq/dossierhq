import {
  SchemaWithMigrations,
  type DossierClient,
  type Entity,
  type Component,
  type ErrorResult,
  type ErrorType,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = string;
type FetcherData = SchemaWithMigrations;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function useAdminSchema(
  client: DossierClient<Entity<string, object>, Component<string, object>>,
): {
  schema: FetcherData | undefined;
  schemaError: FetcherError | undefined;
} {
  const fetcher = useCallback((_action: FetcherKey) => fetchSchema(client), [client]);
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey>(CACHE_KEYS.schema, fetcher);

  // useDebugLogChangedValues('useAdminSchema changed values', { data, error });

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
