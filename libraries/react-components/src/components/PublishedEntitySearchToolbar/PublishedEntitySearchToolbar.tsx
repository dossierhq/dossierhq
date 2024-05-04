import {
  IconButton,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '@dossierhq/design';
import { useContext, type Dispatch, type MouseEventHandler } from 'react';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AuthKeySelector, type AuthKeyItem } from '../AuthKeySelector/AuthKeySelector.js';
import { SearchEntitySearchInput } from '../SearchEntitySearchInput/SearchEntitySearchInput.js';
import {
  TypeSelector,
  type TypeSelectorDispatch,
  type TypeSelectorState,
} from '../TypeSelector/TypeSelector.js';

interface Props {
  showMap: boolean;
  searchEntityState: SearchEntityState;
  typeFilterState: TypeSelectorState;
  authKeyFilterState: MultipleSelectorState<AuthKeyItem>;
  showAuthKeys: boolean;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  dispatchTypeFilterState: TypeSelectorDispatch;
  dispatchAuthKeyFilterState: Dispatch<MultipleSelectorStateAction<AuthKeyItem>>;
  onToggleMapClick: MouseEventHandler<HTMLButtonElement>;
}

export function PublishedEntitySearchToolbar({
  showMap,
  searchEntityState,
  typeFilterState,
  authKeyFilterState,
  showAuthKeys,
  dispatchSearchEntityState,
  dispatchTypeFilterState,
  dispatchAuthKeyFilterState,
  onToggleMapClick,
}: Props) {
  const { authKeys, schema } = useContext(PublishedDossierContext);
  return (
    <>
      <SearchEntitySearchInput {...{ searchEntityState, dispatchSearchEntityState }} />
      <TypeSelector schema={schema} state={typeFilterState} dispatch={dispatchTypeFilterState}>
        Type
      </TypeSelector>
      {showAuthKeys && (
        <AuthKeySelector
          state={authKeyFilterState}
          authKeys={authKeys}
          dispatch={dispatchAuthKeyFilterState}
        >
          Auth keys
        </AuthKeySelector>
      )}
      <IconButton icon={showMap ? 'list' : 'map'} onClick={onToggleMapClick} />
    </>
  );
}
