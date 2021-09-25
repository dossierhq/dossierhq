import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  ErrorResult,
  Paging,
} from '@jonasb/datadata-core';
import { createErrorResultFromError, ErrorType } from '@jonasb/datadata-core';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

/**
 * @param adminClient
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @returns If no result, `connection` is `undefined`. If there are no matches, `connection` is `null`
 */
export function useSearchEntities(
  adminClient: AdminClient,
  query: AdminQuery | undefined,
  paging?: Paging
): {
  connection: Connection<Edge<AdminEntity, ErrorType>> | null | undefined;
  connectionError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback(
    (_action: string, paramsJson: string) => {
      const { query, paging } = JSON.parse(paramsJson) as {
        query: AdminQuery;
        paging: Paging | undefined;
      };
      return fetchSearchEntities(adminClient, query, paging);
    },
    [adminClient]
  );
  const { data, error } = useSWR(
    query ? ['useSearchEntities', JSON.stringify({ query, paging })] : null,
    fetcher
  );
  const connectionError = useMemo(
    () =>
      error
        ? createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.Generic])
        : undefined,
    [error]
  );

  return { connection: data, connectionError };
}

async function fetchSearchEntities(
  adminClient: AdminClient,
  query: AdminQuery,
  paging: Paging | undefined
): Promise<Connection<Edge<AdminEntity, ErrorType>> | null> {
  const result = await adminClient.searchEntities(query, paging);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
