import { useEffect, type Dispatch } from 'react';
import {
  ChangelogStateActions,
  type ChangelogState,
  type ChangelogStateAction,
} from '../reducers/ChangelogReducer.js';
import { useChangelogEvents } from './useChangelogEvents.js';
import { useChangelogEventsTotalCount } from './useChangelogEventsTotalCount.js';

export function useLoadChangelog(
  changelogState: ChangelogState,
  dispatchChangelog: Dispatch<ChangelogStateAction>,
) {
  const { connection, connectionError } = useChangelogEvents(
    changelogState.query,
    changelogState.paging,
  );
  const { totalCount } = useChangelogEventsTotalCount(changelogState.query);

  useEffect(() => {
    dispatchChangelog(new ChangelogStateActions.UpdateSearchResult(connection, connectionError));
  }, [connection, connectionError, dispatchChangelog]);

  useEffect(() => {
    dispatchChangelog(new ChangelogStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchChangelog]);
}
