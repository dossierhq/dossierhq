import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import { AdminDossierContext } from '../contexts/AdminDossierContext.js';
import {
  ChangelogStateActions,
  type ChangelogState,
  type ChangelogStateAction,
} from '../reducers/ChangelogReducer/ChangelogReducer.js';
import { useAdminChangelogEvents } from './useAdminChangelogEvents.js';
import { useAdminChangelogTotalCount } from './useAdminChangelogTotalCount.js';

export function useAdminLoadChangelog(
  changelogState: ChangelogState,
  dispatchChangelogState: Dispatch<ChangelogStateAction>,
) {
  const { adminClient } = useContext(AdminDossierContext);

  // get events
  const { connection, connectionError } = useAdminChangelogEvents(
    adminClient,
    changelogState.query,
    changelogState.paging,
  );
  const { totalCount } = useAdminChangelogTotalCount(adminClient, changelogState.query);

  useEffect(() => {
    dispatchChangelogState(
      new ChangelogStateActions.UpdateSearchResult(connection, connectionError),
    );
  }, [connection, connectionError, dispatchChangelogState]);

  useEffect(() => {
    dispatchChangelogState(new ChangelogStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchChangelogState]);
}
