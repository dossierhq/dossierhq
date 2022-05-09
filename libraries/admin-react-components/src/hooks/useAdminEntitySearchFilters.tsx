import type { AdminSearchQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect, useReducer } from 'react';
import {
  AdminDataDataContext,
  initializeAuthKeySelectorState,
  initializeEntityTypeSelectorState,
  initializeStatusSelectorState,
  reduceAuthKeySelectorState,
  reduceEntityTypeSelectorState,
  reduceStatusSelectorState,
  SearchEntityStateActions,
} from '..';
import type { SearchEntityState, SearchEntityStateAction } from '../shared';

export function useAdminEntitySearchFilters(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { authKeys } = useContext(AdminDataDataContext);

  const [entityTypeFilterState, dispatchEntityTypeFilterState] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: searchEntityState.query.entityTypes },
    initializeEntityTypeSelectorState
  );

  const [statusFilterState, dispatchStatusFilterState] = useReducer(
    reduceStatusSelectorState,
    {
      selectedIds: (searchEntityState.query as AdminSearchQuery).status,
    },
    initializeStatusSelectorState
  );

  const [authKeyFilterState, dispatchAuthKeyFilterState] = useReducer(
    reduceAuthKeySelectorState,
    {
      authKeys,
      selectedIds: searchEntityState.query.authKeys,
    },
    initializeAuthKeySelectorState
  );

  // sync entity type filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { entityTypes: entityTypeFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true }
      )
    );
  }, [dispatchSearchEntityState, entityTypeFilterState.selectedIds]);

  // sync status filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { status: statusFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true }
      )
    );
  }, [dispatchSearchEntityState, statusFilterState.selectedIds]);

  // sync auth key filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { authKeys: authKeyFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true }
      )
    );
  }, [authKeyFilterState.selectedIds, dispatchSearchEntityState]);

  //
  return {
    entityTypeFilterState,
    dispatchEntityTypeFilterState,
    statusFilterState,
    dispatchStatusFilterState,
    authKeyFilterState,
    dispatchAuthKeyFilterState,
  };
}
