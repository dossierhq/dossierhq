import type { MultipleSelectorState, MultipleSelectorStateAction } from '@jonasb/datadata-design';
import { IconButton } from '@jonasb/datadata-design';
import type { Dispatch, MouseEventHandler } from 'react';
import React, { useContext } from 'react';
import { AdminDataDataContext, AdminTypePicker, StatusSelector } from '../..';
import type { AuthKeyItem } from '../../shared/components/AuthKeySelector/AuthKeySelector';
import { AuthKeySelector } from '../../shared/components/AuthKeySelector/AuthKeySelector';
import type { EntityTypeItem } from '../../shared/components/EntityTypeSelector/EntityTypeSelector';
import { EntityTypeSelector } from '../../shared/components/EntityTypeSelector/EntityTypeSelector';
import { SearchEntitySearchInput } from '../../shared/components/SearchEntitySearchInput/SearchEntitySearchInput.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import type { StatusItem } from '../StatusSelector/StatusSelector';

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
  const { schema } = useContext(AdminDataDataContext);
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
      <AuthKeySelector state={authKeyFilterState} dispatch={dispatchAuthKeyFilterState}>
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
