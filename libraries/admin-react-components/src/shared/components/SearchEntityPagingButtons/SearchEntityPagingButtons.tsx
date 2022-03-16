import type { Paging } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../..';
import { ConnectionPagingButtons, SearchEntityStateActions } from '../..';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}

export function SearchEntityPagingButtons({ searchEntityState, dispatchSearchEntityState }: Props) {
  const handlePagingChange = useCallback(
    (paging: Paging) => {
      dispatchSearchEntityState(new SearchEntityStateActions.SetPaging(paging));
    },
    [dispatchSearchEntityState]
  );

  return (
    <ConnectionPagingButtons
      connection={searchEntityState.connection}
      pagingCount={searchEntityState.requestedCount}
      onPagingChange={handlePagingChange}
    />
  );
}
