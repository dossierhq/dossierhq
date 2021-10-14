import type { Paging } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../index.js';
import { ConnectionPagingButtons, SearchEntityStateActions } from '../../index.js';

export function SearchEntityPagingButtons({
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
    [dispatchSearchEntityState]
  );

  return (
    <ConnectionPagingButtons
      connection={searchEntityState.connection}
      paging={searchEntityState.paging}
      pagingCount={searchEntityState.pagingCount}
      onPagingChange={handlePagingChange}
    />
  );
}
