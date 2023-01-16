import type { MultipleSelectorState, MultipleSelectorStateAction } from '@dossierhq/design';
import { IconButton } from '@dossierhq/design';
import type { Dispatch, MouseEventHandler } from 'react';
import { useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import type { AuthKeyItem } from '../../shared/components/AuthKeySelector/AuthKeySelector.js';
import { AuthKeySelector } from '../../shared/components/AuthKeySelector/AuthKeySelector.js';
import type { EntityTypeItem } from '../../shared/components/EntityTypeSelector/EntityTypeSelector.js';
import { EntityTypeSelector } from '../../shared/components/EntityTypeSelector/EntityTypeSelector.js';
import { SearchEntitySearchInput } from '../../shared/components/SearchEntitySearchInput/SearchEntitySearchInput.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AdminTypePicker } from '../AdminTypePicker/AdminTypePicker.js';
import type { StatusItem } from '../StatusSelector/StatusSelector.js';
import { StatusSelector } from '../StatusSelector/StatusSelector.js';

interface Props {
  showMap: boolean;
  searchEntityState: SearchEntityState;
  entityTypeFilterState: MultipleSelectorState<EntityTypeItem>;
  statusFilterState: MultipleSelectorState<StatusItem>;
  authKeyFilterState: MultipleSelectorState<AuthKeyItem>;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  dispatchEntityTypeFilterState: Dispatch<MultipleSelectorStateAction<EntityTypeItem>>;
  dispatchStatusFilterState: Dispatch<MultipleSelectorStateAction<StatusItem>>;
  dispatchAuthKeyFilterState: Dispatch<MultipleSelectorStateAction<AuthKeyItem>>;
  onToggleMapClick: MouseEventHandler<HTMLButtonElement>;
  onCreateEntity?: (type: string) => void;
}

export function AdminEntitySearchToolbar({
  showMap,
  searchEntityState,
  entityTypeFilterState,
  statusFilterState,
  authKeyFilterState,
  dispatchSearchEntityState,
  dispatchEntityTypeFilterState,
  dispatchStatusFilterState,
  dispatchAuthKeyFilterState,
  onToggleMapClick,
  onCreateEntity,
}: Props) {
  const { authKeys, schema } = useContext(AdminDataDataContext);
  return (
    <>
      <SearchEntitySearchInput {...{ searchEntityState, dispatchSearchEntityState }} />
      <EntityTypeSelector
        schema={schema}
        state={entityTypeFilterState}
        dispatch={dispatchEntityTypeFilterState}
      >
        Entity type
      </EntityTypeSelector>
      <StatusSelector state={statusFilterState} dispatch={dispatchStatusFilterState}>
        Status
      </StatusSelector>
      <AuthKeySelector
        state={authKeyFilterState}
        authKeys={authKeys}
        dispatch={dispatchAuthKeyFilterState}
      >
        Auth keys
      </AuthKeySelector>
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
