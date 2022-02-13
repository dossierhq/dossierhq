import type { AdminQuery, Paging } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '../index.js';
import { DataDataContext2, SearchEntityStateActions, useSearchEntities } from '../index.js';

/**
 * @param dispatchSearchEntityState
 * @param query If `undefined`, no data is fetched
 * @param paging
 */
export function useLoadSearchEntities(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  query: AdminQuery | undefined,
  paging: Paging
) {
  const { adminClient } = useContext(DataDataContext2);
  const { connection, connectionError } = useSearchEntities(adminClient, query, paging);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateResult(connection, connectionError)
    );
  }, [connection, connectionError, dispatchSearchEntityState]);
}
