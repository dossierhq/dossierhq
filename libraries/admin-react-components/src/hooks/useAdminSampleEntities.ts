import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function useAdminSampleEntities(
  adminClient: AdminClient,
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined
): {
  entitySamples: EntitySamplingPayload<AdminEntity> | undefined;
  entitySamplesError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback(
    (_action: string, paramsJson: string) => {
      const { query, options } = JSON.parse(paramsJson) as {
        query: AdminQuery;
        options: EntitySamplingOptions | undefined;
      };
      return fetchSampleEntities(adminClient, query, options);
    },
    [adminClient]
  );
  const { data, error } = useSWR(
    query ? ['datadata/useAdminSampleEntities', JSON.stringify({ query, options })] : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminSampleEntities updated values', {
  //   adminClient,
  //   query,
  //   options,
  //   data,
  //   error,
  // });
  return { entitySamples: data, entitySamplesError: error };
}

async function fetchSampleEntities(
  adminClient: AdminClient,
  query: AdminQuery,
  options: EntitySamplingOptions | undefined
): Promise<EntitySamplingPayload<AdminEntity>> {
  const result = await adminClient.sampleEntities(query, options);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
