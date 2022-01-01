import type {
  EntityReference,
  ErrorResult,
  ErrorType,
  PublishedClient,
  PublishedEntity,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

export function useEntity(
  publishedClient: PublishedClient,
  reference: EntityReference | undefined
): {
  entity: PublishedEntity | undefined;
  entityError: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback(
    (_action: string, id: string) => fetchEntity(publishedClient, { id }),
    [publishedClient]
  );
  const { data, error } = useSWR(
    reference ? ['datadata/published/useEntity', reference.id] : null,
    fetcher
  );

  return { entity: data, entityError: error };
}

async function fetchEntity(
  publishedClient: PublishedClient,
  reference: EntityReference
): Promise<PublishedEntity> {
  const result = await publishedClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
