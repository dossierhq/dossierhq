import type {
  AdminClient,
  AdminEntity,
  EntityReference,
  ErrorResult,
  ErrorType,
  PublishingHistory,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference]>;
type FetcherData = PublishingHistory;
type FetcherError = ErrorResult<
  unknown,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
>;

export function useAdminPublishingHistory(
  adminClient: AdminClient<AdminEntity<string, object>>,
  reference: EntityReference | undefined
): {
  publishingHistory: FetcherData | undefined;
  publishingHistoryError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchPublishingHistory(adminClient, reference),
    [adminClient]
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.adminPublishingHistory(reference) : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminPublishingHistory changed values', { data, error });

  return { publishingHistory: data, publishingHistoryError: error };
}

async function fetchPublishingHistory(
  adminClient: AdminClient<AdminEntity<string, object>>,
  reference: FetcherKey[1]
): Promise<FetcherData> {
  const result = await adminClient.getPublishingHistory(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
