import type {
  AdminClient,
  AdminEntity,
  EntityReference,
  EntityVersionReference,
  ErrorResult,
  ErrorType,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference | EntityVersionReference]>;
type FetcherData = AdminEntity;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function useAdminEntity(
  adminClient: AdminClient,
  reference: EntityReference | EntityVersionReference | undefined
): {
  entity: FetcherData | undefined;
  entityError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchEntity(adminClient, reference),
    [adminClient]
  );
  const { data, error } = useSWR<FetcherData, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.adminEntity(reference) : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminEntity changed values', { data, error });

  return { entity: data, entityError: error };
}

async function fetchEntity(
  adminClient: AdminClient,
  reference: FetcherKey[1]
): Promise<FetcherData> {
  const result = await adminClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
