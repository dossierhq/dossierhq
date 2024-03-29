import { type Paging } from '@dossierhq/core';
import { useCallback, type Dispatch } from 'react';
import {
  ChangelogStateActions,
  type ChangelogState,
  type ChangelogStateAction,
} from '../../reducers/ChangelogReducer/ChangelogReducer.js';
import { ConnectionPagingButtons } from '../ConnectionPagingButtons/ConnectionPagingButtons.js';
import { ConnectionPagingCount } from '../ConnectionPagingCount/ConnectionPagingCount.js';

interface Props {
  changelogState: ChangelogState;
  dispatchChangelogState: Dispatch<ChangelogStateAction>;
}

export function ChangelogConnectionButtons({ changelogState, dispatchChangelogState }: Props) {
  const handlePagingChange = useCallback(
    (paging: Paging, pagingAction?: 'first-page' | 'prev-page' | 'next-page' | 'last-page') => {
      dispatchChangelogState(new ChangelogStateActions.SetPaging(paging, pagingAction));
    },
    [dispatchChangelogState],
  );

  return (
    <>
      <ConnectionPagingButtons
        connection={changelogState.connection}
        pagingCount={changelogState.requestedCount}
        onPagingChange={handlePagingChange}
      />
      <ConnectionPagingCount
        connection={changelogState.connection}
        paging={changelogState.paging}
        pagingCount={changelogState.requestedCount}
        totalCount={changelogState.totalCount}
        onPagingChange={handlePagingChange}
      />
    </>
  );
}
