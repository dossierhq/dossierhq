import type { AdminEntity, AdminQuery, AdminSearchQuery } from '@jonasb/datadata-core';
import { FullscreenContainer, IconButton, toSizeClassName } from '@jonasb/datadata-design';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../..';
import {
  AdminDataDataContext,
  AdminEntityList,
  AdminEntityMapMarker,
  AdminTypePicker,
  AuthKeySelector,
  AuthKeyTagSelector,
  EntityMap,
  EntityTypeSelector,
  EntityTypeTagSelector,
  initializeAuthKeySelectorState,
  initializeEntityTypeSelectorState,
  initializeSearchEntityStateFromUrlQuery,
  initializeStatusSelectorState,
  reduceAuthKeySelectorState,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  reduceStatusSelectorState,
  SearchEntitySearchInput,
  SearchEntityStateActions,
  SearchOrSampleEntitiesButtons,
  StatusSelector,
  StatusTagSelector,
  useAdminLoadSampleEntities,
  useAdminLoadSearchEntitiesAndTotalCount,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../..';

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
  const { schema, authKeys } = useContext(AdminDataDataContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlQuery,
    initializeSearchEntityStateFromUrlQuery
  );

  const [entityTypeFilterState, dispatchEntityTypeFilterState] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: searchEntityState.query.entityTypes },
    initializeEntityTypeSelectorState
  );

  const [statusFilterState, dispatchStatusFilterState] = useReducer(
    reduceStatusSelectorState,
    {
      selectedIds: (searchEntityState.query as AdminSearchQuery).status,
    },
    initializeStatusSelectorState
  );

  const [authKeyFilterState, dispatchAuthKeyFilterState] = useReducer(
    reduceAuthKeySelectorState,
    {
      authKeys,
      selectedIds: searchEntityState.query.authKeys,
    },
    initializeAuthKeySelectorState
  );

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

  // sync entity type filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { entityTypes: entityTypeFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true }
      )
    );
  }, [entityTypeFilterState.selectedIds]);

  // sync status filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { status: statusFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true }
      )
    );
  }, [statusFilterState.selectedIds]);

  // sync auth key filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { authKeys: authKeyFilterState.selectedIds },
        { partial: true, resetPagingIfModifying: true }
      )
    );
  }, [authKeyFilterState.selectedIds]);

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
        <IconButton icon={showMap ? 'list' : 'map'} onClick={handleToggleShowMap} />
        <AdminTypePicker iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
          Create
        </AdminTypePicker>
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
