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

export function useAdminEntity(
  adminClient: AdminClient,
  reference: EntityReference | EntityVersionReference | undefined
): {
  entity: AdminEntity | undefined;
  entityError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback(
    (_action: string, paramsJson: string) => fetchEntity(adminClient, JSON.parse(paramsJson)),
    [adminClient]
  );
  const { data, error } = useSWR(reference ? CACHE_KEYS.adminEntity(reference) : null, fetcher);

  // useDebugLogChangedValues('useAdminEntity changed values', { data, error });

  return { entity: data, entityError: error };
}

async function fetchEntity(
  adminClient: AdminClient,
  reference: EntityReference | EntityVersionReference
): Promise<AdminEntity> {
  const result = await adminClient.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
