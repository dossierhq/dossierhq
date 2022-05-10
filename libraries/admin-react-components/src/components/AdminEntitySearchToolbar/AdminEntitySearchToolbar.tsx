import type { MultipleSelectorState, MultipleSelectorStateAction } from '@jonasb/datadata-design';
import { IconButton } from '@jonasb/datadata-design';
import type { Dispatch, MouseEventHandler } from 'react';
import React, { useContext } from 'react';
import {
  AdminDataDataContext,
  AdminTypePicker,
  AuthKeySelector,
  EntityTypeSelector,
  SearchEntitySearchInput,
  StatusSelector,
} from '../..';
import type { StatusItem } from '../StatusSelector/StatusSelector';
import type { SearchEntityState, SearchEntityStateAction } from '../../shared';
import type { AuthKeyItem } from '../../shared/components/AuthKeySelector/AuthKeySelector';
import type { EntityTypeItem } from '../../shared/components/EntityTypeSelector/EntityTypeSelector';

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
        restrictEntityTypes={searchEntityState.restrictEntityTypes}
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
        <AdminTypePicker iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
          Create
        </AdminTypePicker>
      ) : null}
    </>
  );
}
