import type { Paging } from '@dossierhq/core';
import { useCallback, type Dispatch } from 'react';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { ConnectionPagingButtons } from '../ConnectionPagingButtons/ConnectionPagingButtons.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}

export function SearchEntityPagingButtons({ searchEntityState, dispatchSearchEntityState }: Props) {
  const handlePagingChange = useCallback(
    (paging: Paging, pagingAction: 'first-page' | 'prev-page' | 'next-page' | 'last-page') => {
      dispatchSearchEntityState(new SearchEntityStateActions.SetPaging(paging, pagingAction));
    },
    [dispatchSearchEntityState],
  );

  return (
    <ConnectionPagingButtons
      connection={searchEntityState.connection}
      pagingCount={searchEntityState.requestedCount}
      onPagingChange={handlePagingChange}
    />
  );
}
