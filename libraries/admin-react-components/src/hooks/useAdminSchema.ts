import type { AdminClient, ErrorResult, ErrorType } from '@jonasb/datadata-core';
import { AdminSchema } from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = string;
type FetcherData = AdminSchema;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function useAdminSchema(adminClient: AdminClient): {
  schema: FetcherData | undefined;
  schemaError: FetcherError | undefined;
} {
  const fetcher = useCallback((_action: FetcherKey) => fetchSchema(adminClient), [adminClient]);
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey>(
    CACHE_KEYS.adminSchema,
    fetcher
  );

  // useDebugLogChangedValues('useAdminSchema changed values', { data, error });

  return { schema: data, schemaError: error };
}

async function fetchSchema(adminClient: AdminClient): Promise<FetcherData> {
  const result = await adminClient.getSchemaSpecification();
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return new AdminSchema(result.value);
}
