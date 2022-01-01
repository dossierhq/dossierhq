import type { Paging, PublishedQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext } from 'react';
import type { SearchEntityStateAction } from '../index.js';
import {
  PublishedDataDataContext,
  useSearchEntities,
  useTotalCount,
  useUpdateSearchEntityStateWithResponse,
} from '../index.js';

export function useLoadSearchEntity(
  query: PublishedQuery,
  paging: Paging,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { publishedClient } = useContext(PublishedDataDataContext);
  const { connection, connectionError } = useSearchEntities(publishedClient, query, paging);
  const { totalCount } = useTotalCount(publishedClient, query);

  useUpdateSearchEntityStateWithResponse(
    connection,
    connectionError,
    totalCount,
    dispatchSearchEntityState
  );
}
