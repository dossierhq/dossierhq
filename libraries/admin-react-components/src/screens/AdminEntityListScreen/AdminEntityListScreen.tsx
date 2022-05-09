import type { AdminEntity, AdminQuery, AdminSearchQuery } from '@jonasb/datadata-core';
import { FullscreenContainer, toSizeClassName } from '@jonasb/datadata-design';
import React, { useCallback, useContext, useReducer, useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../..';
import {
  AdminDataDataContext,
  AdminEntityList,
  AdminEntityMapMarker,
  AuthKeyTagSelector,
  EntityMap,
  EntityTypeTagSelector,
  initializeSearchEntityStateFromUrlQuery,
  reduceSearchEntityState,
  SearchEntityStateActions,
  SearchOrSampleEntitiesButtons,
  StatusTagSelector,
  useAdminLoadSampleEntities,
  useAdminLoadSearchEntitiesAndTotalCount,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../..';
import { AdminEntitySearchToolbar } from '../../components/AdminEntitySearchToolbar/AdminEntitySearchToolbar';
import { useAdminEntitySearchFilters } from '../../hooks/useAdminEntitySearchFilters';

export interface AdminEntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlQuery?: EntitySearchStateUrlQuery;
  onUrlQueryChanged?: (urlQuery: EntitySearchStateUrlQuery) => void;
  onCreateEntity: (entityType: string) => void;
  onOpenEntity: (entity: AdminEntity) => void;
}

export function AdminEntityListScreen({
  header,
  footer,
  urlQuery,
  onUrlQueryChanged,
  onCreateEntity,
  onOpenEntity,
}: AdminEntityListScreenProps): JSX.Element | null {
  const { schema } = useContext(AdminDataDataContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlQuery,
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
    urlQuery,
    onUrlQueryChanged,
    searchEntityState,
    dispatchSearchEntityState
  );

  // load search/total or sampling
  useAdminLoadSearchEntitiesAndTotalCount(
    searchEntityState.paging ? (searchEntityState.query as AdminSearchQuery) : undefined,
    searchEntityState.paging,
    dispatchSearchEntityState
  );

  useAdminLoadSampleEntities(
    searchEntityState.sampling ? (searchEntityState.query as AdminQuery) : undefined,
    searchEntityState.sampling,
    dispatchSearchEntityState
  );

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
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
        >
          <FullscreenContainer.Row>
            <EntityTypeTagSelector
              state={entityTypeFilterState}
              dispatch={dispatchEntityTypeFilterState}
            />
            <StatusTagSelector state={statusFilterState} dispatch={dispatchStatusFilterState} />
            <AuthKeyTagSelector state={authKeyFilterState} dispatch={dispatchAuthKeyFilterState} />
            <AdminEntityList
              {...{ searchEntityState, dispatchSearchEntityState }}
              onItemClick={onOpenEntity}
            />
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      )}
      <FullscreenContainer.Row
        paddingVertical={2}
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
