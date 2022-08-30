import type { MultipleSelectorState, MultipleSelectorStateAction } from '@jonasb/datadata-design';
import { initializeMultipleSelectorState } from '@jonasb/datadata-design';
import isEqual from 'lodash/isEqual';
import type { Dispatch } from 'react';
import { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import {
  initializeAuthKeySelectorState,
  reduceAuthKeySelectorState,
} from '../../shared/components/AuthKeySelector/AuthKeySelector.js';
import type { EntityTypeItem } from '../../shared/components/EntityTypeSelector/EntityTypeSelector.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { PublishedDataDataContext } from '../contexts/PublishedDataDataContext.js';

export function usePublishedEntitySearchFilters(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { authKeys } = useContext(PublishedDataDataContext);

  const [entityTypeFilterState, dispatchEntityTypeFilterState] =
    useSearchStateToEntitySelectorAdapter(searchEntityState, dispatchSearchEntityState);

  const [authKeyFilterState, dispatchAuthKeyFilterState] = useReducer(
    reduceAuthKeySelectorState,
    { authKeys, selectedIds: searchEntityState.query.authKeys },
    initializeAuthKeySelectorState
  );

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
    authKeyFilterState,
    dispatchAuthKeyFilterState,
  };
}

function useSearchStateToEntitySelectorAdapter(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
): [MultipleSelectorState<EntityTypeItem>, Dispatch<MultipleSelectorStateAction<EntityTypeItem>>] {
  const [items, setItems] = useState<EntityTypeItem[]>(
    () => searchEntityState.query.entityTypes?.map((it) => ({ id: it, name: it })) ?? []
  );

  const entityTypeFilterState = useMemo(
    () =>
      initializeMultipleSelectorState({ items, selectedIds: searchEntityState.query.entityTypes }),
    [items, searchEntityState.query.entityTypes]
  );

  const dispatchEntityTypeFilterState = useCallback(
    (action: MultipleSelectorStateAction<EntityTypeItem>) => {
      const newState = action.reduce(entityTypeFilterState);
      if (!isEqual(newState.items, entityTypeFilterState.items)) {
        let newItems = newState.items;
        if (searchEntityState.restrictEntityTypes.length > 0) {
          newItems = newItems.filter((it) => searchEntityState.restrictEntityTypes.includes(it.id));
        }
        setItems((oldItems) => (isEqual(newItems, oldItems) ? oldItems : newItems));
      }
      if (!isEqual(newState.selectedIds, searchEntityState.query.entityTypes)) {
        dispatchSearchEntityState(
          new SearchEntityStateActions.SetQuery(
            { entityTypes: newState.selectedIds },
            { partial: true, resetPagingIfModifying: true }
          )
        );
      }
    },
    [
      dispatchSearchEntityState,
      entityTypeFilterState,
      searchEntityState.query.entityTypes,
      searchEntityState.restrictEntityTypes,
    ]
  );

  // useDebugLogChangedValues('useSearchStateToEntitySelectorAdapter changed values', {
  //   dispatchSearchEntityState,
  //   entityTypeFilterState,
  //   entityTypes: searchEntityState.query.entityTypes,
  //   restrictEntityTypes: searchEntityState.restrictEntityTypes,
  // });

  return [entityTypeFilterState, dispatchEntityTypeFilterState];
}
