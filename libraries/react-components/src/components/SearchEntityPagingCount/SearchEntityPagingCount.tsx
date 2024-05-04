import type { Paging } from '@dossierhq/core';
import { useCallback, type Dispatch } from 'react';
import {
  SearchEntityStateActions,
  type SearchEntityState,
  type SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { ConnectionPagingCount } from '../ConnectionPagingCount/ConnectionPagingCount.js';

export function SearchEntityPagingCount({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const handlePagingChange = useCallback(
    (paging: Paging) => {
      dispatchSearchEntityState(new SearchEntityStateActions.SetPaging(paging));
    },
    [dispatchSearchEntityState],
  );

  return (
    <ConnectionPagingCount
      connection={searchEntityState.connection}
      paging={searchEntityState.paging}
      pagingCount={searchEntityState.requestedCount}
      totalCount={searchEntityState.totalCount}
      onPagingChange={handlePagingChange}
    />
  );
}
