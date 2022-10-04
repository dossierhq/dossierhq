import type { MultipleSelectorState, MultipleSelectorStateAction } from '@jonasb/datadata-design';
import { IconButton } from '@jonasb/datadata-design';
import type { Dispatch, MouseEventHandler } from 'react';
import { useContext } from 'react';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import type { AuthKeyItem } from '../../shared/components/AuthKeySelector/AuthKeySelector.js';
import { AuthKeySelector } from '../../shared/components/AuthKeySelector/AuthKeySelector.js';
import type { EntityTypeItem } from '../../shared/components/EntityTypeSelector/EntityTypeSelector.js';
import { EntityTypeSelector } from '../../shared/components/EntityTypeSelector/EntityTypeSelector.js';
import { SearchEntitySearchInput } from '../../shared/components/SearchEntitySearchInput/SearchEntitySearchInput.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';

interface Props {
  showMap: boolean;
  searchEntityState: SearchEntityState;
  entityTypeFilterState: MultipleSelectorState<EntityTypeItem>;
  authKeyFilterState: MultipleSelectorState<AuthKeyItem>;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  dispatchEntityTypeFilterState: Dispatch<MultipleSelectorStateAction<EntityTypeItem>>;
  dispatchAuthKeyFilterState: Dispatch<MultipleSelectorStateAction<AuthKeyItem>>;
  onToggleMapClick: MouseEventHandler<HTMLButtonElement>;
}

export function PublishedEntitySearchToolbar({
  showMap,
  searchEntityState,
  entityTypeFilterState,
  authKeyFilterState,
  dispatchSearchEntityState,
  dispatchEntityTypeFilterState,
  dispatchAuthKeyFilterState,
  onToggleMapClick,
}: Props) {
  const { schema } = useContext(PublishedDataDataContext);
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
      <AuthKeySelector state={authKeyFilterState} dispatch={dispatchAuthKeyFilterState}>
        Auth keys
      </AuthKeySelector>
      <IconButton icon={showMap ? 'list' : 'map'} onClick={onToggleMapClick} />
    </>
  );
}
