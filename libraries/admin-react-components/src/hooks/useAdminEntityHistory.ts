import type {
  AdminClient,
  EntityHistory,
  EntityReference,
  ErrorResult,
  ErrorType,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

export function useAdminEntityHistory(
  adminClient: AdminClient,
  reference: EntityReference | undefined
): {
  entityHistory: EntityHistory | undefined;
  entityHistoryError:
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
    (_action: string, reference: EntityReference) => fetchEntityHistory(adminClient, reference),
    [adminClient]
  );
  const { data, error } = useSWR(
    reference ? CACHE_KEYS.adminEntityHistory(reference) : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminEntityHistory changed values', { data, error });

  return { entityHistory: data, entityHistoryError: error };
}

async function fetchEntityHistory(
  adminClient: AdminClient,
  reference: EntityReference
): Promise<EntityHistory> {
  const result = await adminClient.getEntityHistory(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
