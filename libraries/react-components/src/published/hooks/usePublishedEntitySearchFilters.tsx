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
} from '../../shared/components/AuthKeySelector/AuthKeySelector.js';
import type { TypeItem } from '../../shared/components/TypeSelector/TypeSelector.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';

export function usePublishedEntitySearchFilters(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { authKeys } = useContext(PublishedDossierContext);

  const [typeFilterState, dispatchTypeFilterState] = useSearchStateToTypeSelectorAdapter(
    searchEntityState,
    dispatchSearchEntityState
  );

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
    typeFilterState,
    dispatchTypeFilterState,
    authKeyFilterState,
    dispatchAuthKeyFilterState,
  };
}

function useSearchStateToTypeSelectorAdapter(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
): [MultipleSelectorState<TypeItem>, Dispatch<MultipleSelectorStateAction<TypeItem>>] {
  const [items, setItems] = useState<TypeItem[]>(() => [
    ...(searchEntityState.query.entityTypes?.map(
      (it): TypeItem => ({ id: it, name: it, kind: 'entity' })
    ) ?? []),
    ...(searchEntityState.query.valueTypes?.map(
      (it): TypeItem => ({ id: it, name: it, kind: 'value' })
    ) ?? []),
  ]);

  const typeFilterState = useMemo(
    () =>
      initializeMultipleSelectorState({
        items,
        selectedIds: [
          ...(searchEntityState.query.entityTypes ?? []),
          ...(searchEntityState.query.valueTypes ?? []),
        ],
      }),
    [items, searchEntityState.query.entityTypes, searchEntityState.query.valueTypes]
  );

  const dispatchTypeFilterState = useCallback(
    (action: MultipleSelectorStateAction<TypeItem>) => {
      const newState = action.reduce(typeFilterState);
      if (!isEqual(newState.items, typeFilterState.items)) {
        let newItems = newState.items;
        if (searchEntityState.restrictEntityTypes.length > 0) {
          newItems = newItems.filter(
            (it) => it.kind === 'value' || searchEntityState.restrictEntityTypes.includes(it.id)
          );
        }
        setItems((oldItems) => (isEqual(newItems, oldItems) ? oldItems : newItems));
      }

      const selectedEntityTypeIds: string[] = [];
      const selectedValueTypeIds: string[] = [];
      for (const id of newState.selectedIds) {
        const item = newState.items.find((it) => it.id === id);
        if (item?.kind === 'entity') {
          selectedEntityTypeIds.push(id);
        } else if (item?.kind === 'value') {
          selectedValueTypeIds.push(id);
        }
      }

      if (
        !isEqual(selectedEntityTypeIds, searchEntityState.query.entityTypes) ||
        !isEqual(selectedValueTypeIds, searchEntityState.query.valueTypes)
      ) {
        dispatchSearchEntityState(
          new SearchEntityStateActions.SetQuery(
            { entityTypes: selectedEntityTypeIds, valueTypes: selectedValueTypeIds },
            { partial: true, resetPagingIfModifying: true }
          )
        );
      }
    },
    [
      dispatchSearchEntityState,
      typeFilterState,
      searchEntityState.query.entityTypes,
      searchEntityState.query.valueTypes,
      searchEntityState.restrictEntityTypes,
    ]
  );

  // useDebugLogChangedValues('useSearchStateToEntitySelectorAdapter changed values', {
  //   dispatchSearchEntityState,
  //   typeFilterState,
  //   entityTypes: searchEntityState.query.entityTypes,
  //   valueTypes: searchEntityState.query.valueTypes,
  //   restrictEntityTypes: searchEntityState.restrictEntityTypes,
  // });

  return [typeFilterState, dispatchTypeFilterState];
}
