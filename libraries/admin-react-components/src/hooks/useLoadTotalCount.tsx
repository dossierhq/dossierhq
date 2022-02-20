import type { AdminQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '../index.js';
import { DataDataContext2, SearchEntityStateActions, useTotalCount } from '../index.js';

/**
 *
 * @param dispatchSearchEntityState
 * @param query If `undefined`, no data is fetched
 */
export function useLoadTotalCount(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  query: AdminQuery | undefined
) {
  const { adminClient } = useContext(DataDataContext2);
  const { totalCount } = useTotalCount(adminClient, query);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);
}
