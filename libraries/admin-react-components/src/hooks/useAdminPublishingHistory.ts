import type {
  AdminClient,
  EntityReference,
  ErrorResult,
  ErrorType,
  PublishingHistory,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

export function useAdminPublishingHistory(
  adminClient: AdminClient,
  reference: EntityReference | undefined
): {
  publishingHistory: PublishingHistory | undefined;
  publishingHistoryError:
    | ErrorResult<
        unknown,
        | typeof ErrorType.BadRequest
        | typeof ErrorType.NotFound
        | typeof ErrorType.NotAuthorized
        | typeof ErrorType.Generic
      >
    | undefined;
} {
  const fetcher = useCallback(
    (_action: string, reference: EntityReference) => fetchPublishingHistory(adminClient, reference),
    [adminClient]
  );
  const { data, error } = useSWR(
    reference ? CACHE_KEYS.adminPublishingHistory(reference) : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminPublishingHistory changed values', { data, error });

  return { publishingHistory: data, publishingHistoryError: error };
}

async function fetchPublishingHistory(
  adminClient: AdminClient,
  reference: EntityReference
): Promise<PublishingHistory> {
  const result = await adminClient.getPublishingHistory(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
