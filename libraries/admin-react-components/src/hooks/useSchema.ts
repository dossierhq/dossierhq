import type {
  AdminClient,
  ErrorResult,
  ErrorType,
  SchemaSpecification,
} from '@jonasb/datadata-core';
import { Schema } from '@jonasb/datadata-core';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

export function useSchema(adminClient: AdminClient): {
  schema: Schema | undefined;
  schemaError: ErrorResult<unknown, ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback((_action: string) => fetchSchema(adminClient), [adminClient]);
  const { data, error } = useSWR('useSchema', fetcher);
  const schema = useMemo(() => (data ? new Schema(data) : undefined), [data]);

  return { schema, schemaError: error };
}

async function fetchSchema(adminClient: AdminClient): Promise<SchemaSpecification> {
  const result = await adminClient.getSchemaSpecification();
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
