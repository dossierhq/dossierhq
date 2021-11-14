import type { ErrorResult, ErrorType, PublishedClient } from '@jonasb/datadata-core';
import { AdminSchema } from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

export function useSchema(publishedClient: PublishedClient): {
  schema: AdminSchema | undefined;
  schemaError: ErrorResult<unknown, ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback((_action: string) => fetchSchema(publishedClient), [publishedClient]);
  const { data, error } = useSWR('datadata/published/useSchema', fetcher);

  // useDebugLogChangedValues('useSchema changed values', { data, error });

  return { schema: data, schemaError: error };
}

async function fetchSchema(publishedClient: PublishedClient): Promise<AdminSchema> {
  const result = await publishedClient.getSchemaSpecification();
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return new AdminSchema(result.value);
}
