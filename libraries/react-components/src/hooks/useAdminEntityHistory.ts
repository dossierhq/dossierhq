import type {
  AdminClient,
  AdminEntity,
  EntityHistory,
  EntityReference,
  ErrorResult,
  ErrorType,
  ValueItem,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference]>;
type FetcherData = EntityHistory;
type FetcherError = ErrorResult<
  unknown,
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
>;

export function useAdminEntityHistory(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  reference: EntityReference | undefined
): {
  entityHistory: FetcherData | undefined;
  entityHistoryError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchEntityHistory(adminClient, reference),
    [adminClient]
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.adminEntityHistory(reference) : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminEntityHistory changed values', { data, error });

  return { entityHistory: data, entityHistoryError: error };
}

async function fetchEntityHistory(
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>,
  reference: FetcherKey[1]
): Promise<FetcherData> {
  const result = await adminClient.getEntityHistory(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
