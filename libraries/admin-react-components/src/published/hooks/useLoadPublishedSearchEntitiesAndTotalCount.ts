import type { Paging, PublishedSearchQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import { PublishedDataDataContext, usePublishedSearchEntities, usePublishedTotalCount } from '..';
import type { SearchEntityStateAction } from '../..';
import { SearchEntityStateActions } from '../..';

/**
 * @param query If `undefined`, no data is fetched
 * @param paging
 * @param dispatchSearchEntityState
 */
export function useLoadPublishedSearchEntitiesAndTotalCount(
  query: PublishedSearchQuery | undefined,
  paging: Paging | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { publishedClient } = useContext(PublishedDataDataContext);
  const { connection, connectionError } = usePublishedSearchEntities(
    publishedClient,
    query,
    paging
  );
  const { totalCount } = usePublishedTotalCount(publishedClient, query);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSearchResult(connection, connectionError)
    );
  }, [connection, connectionError, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);
}
