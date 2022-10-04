import type { AdminClient, ErrorResult, ErrorType } from '@jonasb/datadata-core';
import { AdminSchema } from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

export function useAdminSchema(adminClient: AdminClient): {
  schema: AdminSchema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback((_action: string) => fetchSchema(adminClient), [adminClient]);
  const { data, error } = useSWR(CACHE_KEYS.adminSchema, fetcher);

  // useDebugLogChangedValues('useAdminSchema changed values', { data, error });

  return { schema: data, schemaError: error };
}

async function fetchSchema(adminClient: AdminClient): Promise<AdminSchema> {
  const result = await adminClient.getSchemaSpecification();
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return new AdminSchema(result.value);
}
