import type { AdminClient, ErrorResult, SchemaSpecification } from '@jonasb/datadata-core';
import { createErrorResultFromError, ErrorType, Schema } from '@jonasb/datadata-core';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

export function useSchema(adminClient: AdminClient): {
  schema: Schema | undefined;
  schemaError: ErrorResult<unknown, ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback((_key: string) => fetchSchema(adminClient), [adminClient]);
  const { data, error } = useSWR('useSchema', fetcher);
  const schema = useMemo(() => (data ? new Schema(data) : undefined), [data]);

  const schemaError = error ? createErrorResultFromError(error, [ErrorType.Generic]) : undefined;
  return { schema, schemaError };
}

async function fetchSchema(adminClient: AdminClient): Promise<SchemaSpecification> {
  const result = await adminClient.getSchemaSpecification();
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
