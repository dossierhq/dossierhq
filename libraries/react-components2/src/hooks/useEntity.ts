import type {
  DossierClient,
  Entity,
  EntityReference,
  EntityVersionReference,
  ErrorResult,
  ErrorType,
} from '@dossierhq/core';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { DossierContext } from '../contexts/DossierContext.js';
import { CACHE_KEYS } from '../utils/CacheUtils.js';

type FetcherKey = Readonly<[string, EntityReference | EntityVersionReference]>;
type FetcherData<T> = T;
type FetcherError = ErrorResult<unknown, typeof ErrorType.Generic>;

export function useEntity<TEntity extends Entity<string, object> = Entity>(
  reference: EntityReference | EntityVersionReference | undefined,
): {
  entity: FetcherData<TEntity> | undefined;
  entityError: FetcherError | undefined;
} {
  const { client } = useContext(DossierContext);
  const fetcher = useCallback(
    ([_action, reference]: FetcherKey) => fetchEntity(client as DossierClient<TEntity>, reference),
    [client],
  );
  const { data, error } = useSWR<FetcherData<TEntity>, FetcherError, FetcherKey | null>(
    reference ? CACHE_KEYS.getEntity(reference) : null,
    fetcher,
  );

  // useDebugLogChangedValues('useEntity changed values', { data, error });

  return { entity: data, entityError: error };
}

async function fetchEntity<TEntity extends Entity<string, object>>(
  client: DossierClient<TEntity>,
  reference: FetcherKey[1],
): Promise<FetcherData<TEntity>> {
  const result = await client.getEntity(reference);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
