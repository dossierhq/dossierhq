import type { AdminEntity, EntityReference } from '@dossierhq/core';
import { Dialog, FullscreenContainer, IconButton, Text, toSizeClassName } from '@dossierhq/design';
import { useCallback, useContext, useReducer, useState } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { useAdminEntitySearchFilters } from '../../hooks/useAdminEntitySearchFilters.js';
import { useAdminLoadEntitySearch } from '../../hooks/useAdminLoadEntitySearch.js';
import { AuthKeyTagSelector } from '../../shared/components/AuthKeyTagSelector/AuthKeyTagSelector.js';
import { EntityMap } from '../../shared/components/EntityMap/EntityMap.js';
import { EntityTypeTagSelector } from '../../shared/components/EntityTypeTagSelector/EntityTypeTagSelector.js';
import { SearchOrSampleEntitiesButtons } from '../../shared/components/SearchOrSampleEntitiesButtons/SearchOrSampleEntitiesButtons.js';
import {
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AdminEntityList } from '../AdminEntityList/AdminEntityList.js';
import { AdminEntityMapMarker } from '../AdminEntityMapMarker/AdminEntityMapMarker.js';
import { AdminEntitySearchToolbar } from '../AdminEntitySearchToolbar/AdminEntitySearchToolbar.js';
import { StatusTagSelector } from '../StatusTagSelector/StatusTagSelector.js';

interface AdminEntitySelectorDialogProps {
  show: boolean;
  title: string;
  entityTypes?: string[];
  linksFrom?: EntityReference;
  linksTo?: EntityReference;
  onClose: () => void;
  onItemClick: (item: AdminEntity) => void;
  onCreateItemClick?: (type: string) => void;
}

export function AdminEntitySelectorDialog({
  show,
  title,
  entityTypes,
  linksFrom,
  linksTo,
  onClose,
  onItemClick,
  onCreateItemClick,
}: AdminEntitySelectorDialogProps) {
  return (
    <Dialog show={show} modal onClose={onClose} width="wide" height="fill">
      <FullscreenContainer card height="100%">
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
            <Text textStyle="headline5">{title}</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" onClick={onClose} />
        </FullscreenContainer.Row>
        {show ? (
          <Content
            entityTypes={entityTypes}
            linksFrom={linksFrom}
            linksTo={linksTo}
            onItemClick={onItemClick}
            onCreateItemClick={onCreateItemClick}
          />
        ) : null}
      </FullscreenContainer>
    </Dialog>
  );
}

function Content({
  entityTypes,
  linksFrom,
  linksTo,
  onItemClick,
  onCreateItemClick,
}: {
  entityTypes: string[] | undefined;
  linksFrom: EntityReference | undefined;
  linksTo: EntityReference | undefined;
  onItemClick: (item: AdminEntity) => void;
  onCreateItemClick?: (type: string) => void;
}) {
  const { schema } = useContext(AdminDataDataContext);

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { restrictEntityTypes: entityTypes, restrictLinksFrom: linksFrom, restrictLinksTo: linksTo },
    initializeSearchEntityState
  );

  const {
    entityTypeFilterState,
    dispatchEntityTypeFilterState,
    statusFilterState,
    dispatchStatusFilterState,
    authKeyFilterState,
    dispatchAuthKeyFilterState,
  } = useAdminEntitySearchFilters(searchEntityState, dispatchSearchEntityState);

  // map or list
  const [showMap, setShowMap] = useState(!!searchEntityState.query.boundingBox);

  const handleToggleShowMap = useCallback(() => {
    if (showMap) {
      dispatchSearchEntityState(
        new SearchEntityStateActions.SetQuery(
          { boundingBox: undefined },
          { partial: true, resetPagingIfModifying: true }
        )
      );
    }
    setShowMap(!showMap);
  }, [showMap]);

  // load search/total or sampling
  useAdminLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  return (
    <>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <AdminEntitySearchToolbar
          {...{
            showMap,
            searchEntityState,
            entityTypeFilterState,
            statusFilterState,
            authKeyFilterState,
            dispatchSearchEntityState,
            dispatchEntityTypeFilterState,
            dispatchStatusFilterState,
            dispatchAuthKeyFilterState,
            onToggleMapClick: handleToggleShowMap,
            onCreateEntity: onCreateItemClick,
          }}
        />
      </FullscreenContainer.Row>
      {showMap ? (
        <FullscreenContainer.Row fillHeight fullWidth>
          <EntityMap<AdminEntity>
            className={toSizeClassName({ height: '100%' })}
            {...{ schema, searchEntityState, dispatchSearchEntityState }}
            renderEntityMarker={(key, entity, location) => (
              <AdminEntityMapMarker
                key={key}
                entity={entity}
                location={location}
                onClick={() => onItemClick(entity)}
              />
            )}
          />
        </FullscreenContainer.Row>
      ) : (
        <FullscreenContainer.ScrollableRow
          scrollToTopSignal={searchEntityState.entitiesScrollToTopSignal}
        >
          <FullscreenContainer.Row>
            <FullscreenContainer.Item paddingHorizontal={3}>
              <EntityTypeTagSelector
                state={entityTypeFilterState}
                dispatch={dispatchEntityTypeFilterState}
              />
              <StatusTagSelector state={statusFilterState} dispatch={dispatchStatusFilterState} />
              <AuthKeyTagSelector
                state={authKeyFilterState}
                dispatch={dispatchAuthKeyFilterState}
              />
            </FullscreenContainer.Item>
            <AdminEntityList {...{ searchEntityState, dispatchSearchEntityState, onItemClick }} />
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      )}
      <FullscreenContainer.Row
        paddingHorizontal={2}
        paddingVertical={2}
        columnGap={2}
        flexDirection="row"
        alignItems="center"
      >
        <SearchOrSampleEntitiesButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
    </>
  );
}
