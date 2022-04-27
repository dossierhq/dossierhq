import type { AdminSearchQuery, Paging } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '..';
import {
  AdminDataDataContext,
  SearchEntityStateActions,
  useSearchEntities,
  useTotalCount,
} from '..';

/**
 * @param dispatchSearchEntityState
 * @param query If `undefined`, no data is fetched
 * @param paging
 */
export function useLoadSearchEntitiesAndTotalCount(
  query: AdminSearchQuery | undefined,
  paging: Paging | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { connection, connectionError } = useSearchEntities(adminClient, query, paging);
  const { totalCount } = useTotalCount(adminClient, query);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSearchResult(connection, connectionError)
    );
  }, [connection, connectionError, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);
}
