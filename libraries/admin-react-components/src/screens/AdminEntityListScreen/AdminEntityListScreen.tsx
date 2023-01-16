import type { AdminEntity } from '@dossierhq/core';
import { FullscreenContainer, toSizeClassName } from '@jonasb/datadata-design';
import React, { useCallback, useContext, useReducer, useState } from 'react';
import { AdminEntityList } from '../../components/AdminEntityList/AdminEntityList.js';
import { AdminEntityMapMarker } from '../../components/AdminEntityMapMarker/AdminEntityMapMarker.js';
import { AdminEntitySearchToolbar } from '../../components/AdminEntitySearchToolbar/AdminEntitySearchToolbar.js';
import { StatusTagSelector } from '../../components/StatusTagSelector/StatusTagSelector.js';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { useAdminEntitySearchFilters } from '../../hooks/useAdminEntitySearchFilters.js';
import { useAdminLoadEntitySearch } from '../../hooks/useAdminLoadEntitySearch.js';
import { AuthKeyTagSelector } from '../../shared/components/AuthKeyTagSelector/AuthKeyTagSelector.js';
import { EntityMap } from '../../shared/components/EntityMap/EntityMap.js';
import { EntityTypeTagSelector } from '../../shared/components/EntityTypeTagSelector/EntityTypeTagSelector.js';
import { SearchOrSampleEntitiesButtons } from '../../shared/components/SearchOrSampleEntitiesButtons/SearchOrSampleEntitiesButtons.js';
import {
  reduceSearchEntityState,
  SearchEntityStateActions,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import {
  initializeSearchEntityStateFromUrlQuery,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityUrlSynchronizer.js';

export interface AdminEntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
  onCreateEntity: (entityType: string) => void;
  onOpenEntity: (entity: AdminEntity) => void;
}

export function AdminEntityListScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
  onCreateEntity,
  onOpenEntity,
}: AdminEntityListScreenProps): JSX.Element | null {
  const { schema } = useContext(AdminDataDataContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlSearchParams,
    initializeSearchEntityStateFromUrlQuery
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

  // sync url <-> search entity state
  useSynchronizeUrlQueryAndSearchEntityState(
    urlSearchParams,
    onUrlSearchParamsChange,
    searchEntityState,
    dispatchSearchEntityState
  );

  // load search/total or sampling
  useAdminLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  const isEmpty = searchEntityState.entities?.length === 0;

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.ScrollableRow direction="horizontal">
        <FullscreenContainer.Row
          center
          flexDirection="row"
          gap={2}
          paddingVertical={2}
          paddingHorizontal={2}
        >
          <AdminEntitySearchToolbar
            {...{
              showMap,
              searchEntityState,
              dispatchSearchEntityState,
              onToggleMapClick: handleToggleShowMap,
              onCreateEntity,
              entityTypeFilterState,
              dispatchEntityTypeFilterState,
              statusFilterState,
              dispatchStatusFilterState,
              authKeyFilterState,
              dispatchAuthKeyFilterState,
            }}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
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
                onClick={() => onOpenEntity(entity)}
              />
            )}
          />
        </FullscreenContainer.Row>
      ) : (
        <FullscreenContainer.ScrollableRow
          scrollToTopSignal={searchEntityState.entitiesScrollToTopSignal}
          shadows="bottom"
        >
          <FullscreenContainer.Row height={isEmpty ? '100%' : undefined} paddingHorizontal={2}>
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
            <AdminEntityList
              {...{ searchEntityState, dispatchSearchEntityState }}
              onItemClick={onOpenEntity}
            />
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      )}
      <FullscreenContainer.Row
        paddingVertical={2}
        paddingHorizontal={2}
        columnGap={2}
        flexDirection="row"
        alignItems="center"
      >
        <SearchOrSampleEntitiesButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
