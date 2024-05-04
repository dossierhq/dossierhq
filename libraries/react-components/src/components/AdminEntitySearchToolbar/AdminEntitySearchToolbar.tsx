import {
  IconButton,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '@dossierhq/design';
import { useContext, type Dispatch, type MouseEventHandler } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AdminTypePicker } from '../AdminTypePicker/AdminTypePicker.js';
import { AuthKeySelector, type AuthKeyItem } from '../AuthKeySelector/AuthKeySelector.js';
import { SearchEntitySearchInput } from '../SearchEntitySearchInput/SearchEntitySearchInput.js';
import { StatusSelector, type StatusItem } from '../StatusSelector/StatusSelector.js';
import {
  TypeSelector,
  type TypeItem,
  type TypeSelectorDispatch,
} from '../TypeSelector/TypeSelector.js';

interface Props {
  showMap: boolean;
  searchEntityState: SearchEntityState;
  typeFilterState: MultipleSelectorState<TypeItem>;
  statusFilterState: MultipleSelectorState<StatusItem>;
  authKeyFilterState: MultipleSelectorState<AuthKeyItem>;
  showAuthKeys: boolean;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  dispatchTypeFilterState: TypeSelectorDispatch;
  dispatchStatusFilterState: Dispatch<MultipleSelectorStateAction<StatusItem>>;
  dispatchAuthKeyFilterState: Dispatch<MultipleSelectorStateAction<AuthKeyItem>>;
  onToggleMapClick: MouseEventHandler<HTMLButtonElement>;
  onCreateEntity?: (type: string) => void;
}

export function AdminEntitySearchToolbar({
  showMap,
  searchEntityState,
  typeFilterState,
  statusFilterState,
  authKeyFilterState,
  showAuthKeys,
  dispatchSearchEntityState,
  dispatchTypeFilterState,
  dispatchStatusFilterState,
  dispatchAuthKeyFilterState,
  onToggleMapClick,
  onCreateEntity,
}: Props) {
  const { authKeys, schema } = useContext(AdminDossierContext);
  return (
    <>
      <SearchEntitySearchInput {...{ searchEntityState, dispatchSearchEntityState }} />
      <TypeSelector schema={schema} state={typeFilterState} dispatch={dispatchTypeFilterState}>
        Type
      </TypeSelector>
      <StatusSelector state={statusFilterState} dispatch={dispatchStatusFilterState}>
        Status
      </StatusSelector>
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
      {onCreateEntity ? (
        <AdminTypePicker
          iconLeft="add"
          showEntityTypes
          entityTypes={searchEntityState.restrictEntityTypes}
          onTypeSelected={onCreateEntity}
        >
          Create
        </AdminTypePicker>
      ) : null}
    </>
  );
}
