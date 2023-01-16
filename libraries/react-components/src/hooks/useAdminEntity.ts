import type {
  AdminClient,
  AdminEntity,
  EntityReference,
  EntityVersionReference,
  ErrorResult,
  ErrorType,
} from '@dossierhq/core';
import { useCallback } from 'react';
import useSWR from 'swr';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference | EntityVersionReference]>;
type FetcherData<T> = T;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function useAdminEntity<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  reference: EntityReference | EntityVersionReference | undefined
): {
  entity: FetcherData<TAdminEntity> | undefined;
  entityError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchEntity(adminClient, reference),
    [adminClient]
  );
  const { data, error } = useSWR<FetcherData<TAdminEntity>, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.adminEntity(reference) : null,
    fetcher
  );

  // useDebugLogChangedValues('useAdminEntity changed values', { data, error });

  return { entity: data, entityError: error };
}

async function fetchEntity<TAdminEntity extends AdminEntity<string, object>>(
  adminClient: AdminClient<TAdminEntity>,
  reference: FetcherKey[1]
): Promise<FetcherData<TAdminEntity>> {
  const result = await adminClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
