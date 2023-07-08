import type { AdminEntity, EntityReference } from '@dossierhq/core';
import { Dialog2, FullscreenContainer, IconButton, Text, toSizeClassName } from '@dossierhq/design';
import { useCallback, useContext, useReducer, useState } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { useAdminEntitySearchFilters } from '../../hooks/useAdminEntitySearchFilters.js';
import { useAdminLoadEntitySearch } from '../../hooks/useAdminLoadEntitySearch.js';
import { AuthKeyTagSelector } from '../../shared/components/AuthKeyTagSelector/AuthKeyTagSelector.js';
import { EntityMap } from '../../shared/components/EntityMap/EntityMap.js';
import { SearchOrSampleEntitiesButtons } from '../../shared/components/SearchOrSampleEntitiesButtons/SearchOrSampleEntitiesButtons.js';
import { TypeTagSelector } from '../../shared/components/TypeTagSelector/TypeTagSelector.js';
import {
  SearchEntityStateActions,
  initializeSearchEntityState,
  reduceSearchEntityState,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AdminEntityList } from '../AdminEntityList/AdminEntityList.js';
import { AdminEntityMapMarker } from '../AdminEntityMapMarker/AdminEntityMapMarker.js';
import { AdminEntitySearchToolbar } from '../AdminEntitySearchToolbar/AdminEntitySearchToolbar.js';
import { StatusTagSelector } from '../StatusTagSelector/StatusTagSelector.js';

interface AdminEntitySelectorDialogProps {
  title: string;
  entityTypes?: string[];
  linksFrom?: EntityReference;
  linksTo?: EntityReference;
  onItemClick: (item: AdminEntity) => void;
  onCreateItemClick?: (type: string) => void;
}

export function AdminEntitySelectorDialog({
  title,
  entityTypes,
  linksFrom,
  linksTo,
  onItemClick,
  onCreateItemClick,
}: AdminEntitySelectorDialogProps) {
  return (
    <Dialog2 width="wide" height="fill">
      {({ close }) => (
        <FullscreenContainer card height="100%">
          <FullscreenContainer.Row flexDirection="row" alignItems="center">
            <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
              <Text textStyle="headline5">{title}</Text>
            </FullscreenContainer.Item>
            <IconButton icon="close" color="white" onClick={close} />
          </FullscreenContainer.Row>

          <Content
            entityTypes={entityTypes}
            linksFrom={linksFrom}
            linksTo={linksTo}
            onItemClick={onItemClick}
            onCreateItemClick={onCreateItemClick}
          />
        </FullscreenContainer>
      )}
    </Dialog2>
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
  const { schema } = useContext(AdminDossierContext);

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    {
      mode: 'admin',
      restrictEntityTypes: entityTypes,
      restrictLinksFrom: linksFrom,
      restrictLinksTo: linksTo,
    },
    initializeSearchEntityState,
  );

  const {
    typeFilterState,
    dispatchTypeFilterState,
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
          { partial: true, resetPagingIfModifying: true },
        ),
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
            typeFilterState,
            statusFilterState,
            authKeyFilterState,
            dispatchSearchEntityState,
            dispatchTypeFilterState,
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
              <TypeTagSelector state={typeFilterState} dispatch={dispatchTypeFilterState} />
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
