import type { EntityQuery } from '@dossierhq/core';
import {
  initializeMultipleSelectorState,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '@dossierhq/design';
import isEqual from 'lodash/isEqual.js';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
} from 'react';
import {
  initializeAuthKeySelectorState,
  reduceAuthKeySelectorState,
} from '../components/AuthKeySelector/AuthKeySelector.js';
import {
  initializeStatusSelectorState,
  reduceStatusSelectorState,
} from '../components/StatusSelector/StatusSelector.js';
import type { TypeItem } from '../components/TypeSelector/TypeSelector.js';
import { DossierContext } from '../contexts/DossierContext.js';
import {
  SearchEntityStateActions,
  type SearchEntityState,
  type SearchEntityStateAction,
} from '../reducers/SearchEntityReducer/SearchEntityReducer.js';

export function useAdminEntitySearchFilters(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
) {
  const { authKeys } = useContext(DossierContext);

  const [typeFilterState, dispatchTypeFilterState] = useSearchStateToTypeSelectorAdapter(
    searchEntityState,
    dispatchSearchEntityState,
  );

  const [statusFilterState, dispatchStatusFilterState] = useReducer(
    reduceStatusSelectorState,
    { selectedIds: (searchEntityState.query as EntityQuery).status },
    initializeStatusSelectorState,
  );

  const [authKeyFilterState, dispatchAuthKeyFilterState] = useReducer(
    reduceAuthKeySelectorState,
    { authKeys, selectedIds: searchEntityState.query.authKeys },
    initializeAuthKeySelectorState,
  );

  // sync status filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { status: statusFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true },
      ),
    );
  }, [dispatchSearchEntityState, statusFilterState.selectedIds]);

  // sync auth key filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { authKeys: authKeyFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true },
      ),
    );
  }, [authKeyFilterState.selectedIds, dispatchSearchEntityState]);

  //
  return {
    typeFilterState,
    dispatchTypeFilterState,
    statusFilterState,
    dispatchStatusFilterState,
    authKeyFilterState,
    dispatchAuthKeyFilterState,
  };
}

function useSearchStateToTypeSelectorAdapter(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
): [MultipleSelectorState<TypeItem>, Dispatch<MultipleSelectorStateAction<TypeItem>>] {
  const [items, setItems] = useState<TypeItem[]>(() => {
    return [
      ...(searchEntityState.query.entityTypes?.map(
        (it): TypeItem => ({ id: it, name: it, kind: 'entity' }),
      ) ?? []),
      ...(searchEntityState.query.componentTypes?.map(
        (it): TypeItem => ({ id: it, name: it, kind: 'component' }),
      ) ?? []),
    ];
  });

  const typeFilterState = useMemo(
    () =>
      initializeMultipleSelectorState({
        items,
        selectedIds: [
          ...(searchEntityState.query.entityTypes ?? []),
          ...(searchEntityState.query.componentTypes ?? []),
        ],
      }),
    [items, searchEntityState.query.entityTypes, searchEntityState.query.componentTypes],
  );

  const dispatchTypeFilterState = useCallback(
    (action: MultipleSelectorStateAction<TypeItem>) => {
      const newState = action.reduce(typeFilterState);
      if (!isEqual(newState.items, typeFilterState.items)) {
        let newItems = newState.items;
        if (searchEntityState.restrictEntityTypes.length > 0) {
          newItems = newItems.filter(
            (it) =>
              it.kind === 'component' || searchEntityState.restrictEntityTypes.includes(it.id),
          );
        }
        setItems((oldItems) => (isEqual(newItems, oldItems) ? oldItems : newItems));
      }

      const selectedEntityTypeIds: string[] = [];
      const selectedComponentTypeIds: string[] = [];
      for (const id of newState.selectedIds) {
        const item = newState.items.find((it) => it.id === id);
        if (item?.kind === 'entity') {
          selectedEntityTypeIds.push(id);
        } else if (item?.kind === 'component') {
          selectedComponentTypeIds.push(id);
        }
      }

      if (
        !isEqual(selectedEntityTypeIds, searchEntityState.query.entityTypes) ||
        !isEqual(selectedComponentTypeIds, searchEntityState.query.componentTypes)
      ) {
        dispatchSearchEntityState(
          new SearchEntityStateActions.SetQuery(
            { entityTypes: selectedEntityTypeIds, componentTypes: selectedComponentTypeIds },
            { partial: true, resetPagingIfModifying: true },
          ),
        );
      }
    },
    [
      dispatchSearchEntityState,
      typeFilterState,
      searchEntityState.query.entityTypes,
      searchEntityState.query.componentTypes,
      searchEntityState.restrictEntityTypes,
    ],
  );

  // useDebugLogChangedValues('useSearchStateToEntitySelectorAdapter changed values', {
  //   dispatchSearchEntityState,
  //   entityTypeFilterState,
  //   entityTypes: searchEntityState.query.entityTypes,
  //   componentTypes: searchEntityState.query.componentTypes,
  //   restrictEntityTypes: searchEntityState.restrictEntityTypes,
  // });

  return [typeFilterState, dispatchTypeFilterState];
}
