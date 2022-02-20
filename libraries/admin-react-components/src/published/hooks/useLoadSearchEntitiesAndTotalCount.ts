import type { Paging, PublishedSearchQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '../index.js';
import {
  PublishedDataDataContext,
  SearchEntityStateActions,
  useSearchEntities,
  useTotalCount,
} from '../index.js';

/**
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @param dispatchSearchEntityState
 */
export function useLoadSearchEntitiesAndTotalCount(
  query: PublishedSearchQuery | undefined,
  paging: Paging | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { publishedClient } = useContext(PublishedDataDataContext);
  const { connection, connectionError } = useSearchEntities(publishedClient, query, paging);
  const { totalCount } = useTotalCount(publishedClient, query);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSearchResult(connection, connectionError)
    );
  }, [connection, connectionError, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);
}
