import { useContext, useEffect, type Dispatch } from 'react';
import { DossierContext } from '../contexts/DossierContext.js';
import {
  ChangelogStateActions,
  type ChangelogState,
  type ChangelogStateAction,
} from '../reducers/ChangelogReducer/ChangelogReducer.js';
import { useAdminChangelogEvents } from './useAdminChangelogEvents.js';
import { useAdminChangelogEventsTotalCount } from './useAdminChangelogEventsTotalCount.js';

export function useAdminLoadChangelog(
  changelogState: ChangelogState,
  dispatchChangelogState: Dispatch<ChangelogStateAction>,
) {
  const { client } = useContext(DossierContext);

  // get events
  const { connection, connectionError } = useAdminChangelogEvents(
    client,
    changelogState.query,
    changelogState.paging,
  );
  const { totalCount } = useAdminChangelogEventsTotalCount(client, changelogState.query);

  useEffect(() => {
    dispatchChangelogState(
      new ChangelogStateActions.UpdateSearchResult(connection, connectionError),
    );
  }, [connection, connectionError, dispatchChangelogState]);

  useEffect(() => {
    dispatchChangelogState(new ChangelogStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchChangelogState]);
}
