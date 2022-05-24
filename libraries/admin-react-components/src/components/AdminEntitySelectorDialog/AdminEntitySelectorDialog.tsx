import type { AdminEntity } from '@jonasb/datadata-core';
import {
  Dialog,
  FullscreenContainer,
  IconButton,
  Text,
  toSizeClassName,
} from '@jonasb/datadata-design';
import React, { useCallback, useContext, useReducer, useState } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminEntitySearchFilters } from '../../hooks/useAdminEntitySearchFilters';
import { useAdminLoadEntitySearch } from '../../hooks/useAdminLoadEntitySearch';
import {
  AuthKeyTagSelector,
  EntityMap,
  EntityTypeTagSelector,
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
  SearchOrSampleEntitiesButtons,
} from '../../shared';
import { AdminEntityList } from '../AdminEntityList/AdminEntityList';
import { AdminEntityMapMarker } from '../AdminEntityMapMarker/AdminEntityMapMarker';
import { AdminEntitySearchToolbar } from '../AdminEntitySearchToolbar/AdminEntitySearchToolbar';
import { StatusTagSelector } from '../StatusTagSelector/StatusTagSelector';

interface AdminEntitySelectorDialogProps {
  show: boolean;
  title: string;
  entityTypes?: string[] | undefined;
  onClose: () => void;
  onItemClick: (item: AdminEntity) => void;
  onCreateItemClick?: (type: string) => void;
}

export function AdminEntitySelectorDialog({
  show,
  title,
  entityTypes,
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
  onItemClick,
  onCreateItemClick,
}: {
  entityTypes: string[] | undefined;
  onItemClick: (item: AdminEntity) => void;
  onCreateItemClick?: (type: string) => void;
}) {
  const { schema } = useContext(AdminDataDataContext);

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { restrictEntityTypes: entityTypes },
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
