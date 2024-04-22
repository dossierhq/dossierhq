import type {
  AdminClient,
  Entity,
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

export function useAdminEntity<TEntity extends Entity<string, object>>(
  adminClient: AdminClient<TEntity>,
  reference: EntityReference | EntityVersionReference | undefined,
): {
  entity: FetcherData<TEntity> | undefined;
  entityError: FetcherError | undefined;
} {
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchEntity(adminClient, reference),
    [adminClient],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.adminEntity(reference) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useAdminEntity changed values', { data, error });

  return { entity: data, entityError: error };
}

async function fetchEntity<TEntity extends Entity<string, object>>(
  adminClient: AdminClient<TEntity>,
  reference: FetcherKey[1],
): Promise<FetcherData<TEntity>> {
  const result = await adminClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
