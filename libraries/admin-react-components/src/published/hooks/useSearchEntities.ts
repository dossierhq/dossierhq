import type {
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
  PublishedClient,
  PublishedEntity,
  PublishedQuery,
} from '@jonasb/datadata-core';
import { useCallback } from 'react';
import useSWR from 'swr';

/**
 * @param publishedClient
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @returns If no result, `connection` is `undefined`. If there are no matches, `connection` is `null`
 */
export function useSearchEntities(
  publishedClient: PublishedClient,
  query: PublishedQuery | undefined,
  paging?: Paging
): {
  connection: Connection<Edge<PublishedEntity, ErrorType>> | null | undefined;
  connectionError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
} {
  const fetcher = useCallback(
    (_action: string, paramsJson: string) => {
      const { query, paging } = JSON.parse(paramsJson) as {
        query: PublishedQuery;
        paging: Paging | undefined;
      };
      return fetchSearchEntities(publishedClient, query, paging);
    },
    [publishedClient]
  );
  const { data, error } = useSWR(
    query
      ? ['datadata/published/usePublishedSearchEntities', JSON.stringify({ query, paging })]
      : null,
    fetcher
  );

  // useDebugLogChangedValues('useSearchEntities updated values', { publishedClient, query, paging, data, error, });
  return { connection: data, connectionError: error };
}

async function fetchSearchEntities(
  publishedClient: PublishedClient,
  query: PublishedQuery,
  paging: Paging | undefined
): Promise<Connection<Edge<PublishedEntity, ErrorType>> | null> {
  const result = await publishedClient.searchEntities(query, paging);
  if (result.isError()) {
    throw result; // throw result, don't convert to Error
  }
  return result.value;
}
