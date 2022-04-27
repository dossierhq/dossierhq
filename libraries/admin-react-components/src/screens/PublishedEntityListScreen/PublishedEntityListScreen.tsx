import type { PublishedEntity, PublishedQuery, PublishedSearchQuery } from '@jonasb/datadata-core';
import { FullscreenContainer, IconButton, toSizeClassName } from '@jonasb/datadata-design';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../..';
import {
  AuthKeySelector,
  AuthKeyTagSelector,
  EntityMap,
  EntityTypeSelector,
  EntityTypeTagSelector,
  initializeAuthKeySelectorState,
  initializeEntityTypeSelectorState,
  initializeSearchEntityStateFromUrlQuery,
  reduceAuthKeySelectorState,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  SearchEntitySearchInput,
  SearchEntityStateActions,
  SearchOrSampleEntitiesButtons,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../..';
import {
  PublishedEntityList,
  PublishedEntityMapMarker,
  PublishedDataDataContext,
  useLoadPublishedSampleEntities,
  useLoadPublishedSearchEntitiesAndTotalCount,
} from '../../published';

export interface PublishedEntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlQuery?: EntitySearchStateUrlQuery;
  onUrlQueryChanged?: (urlQuery: EntitySearchStateUrlQuery) => void;
  onOpenEntity: (entity: PublishedEntity) => void;
}

export function PublishedEntityListScreen({
  header,
  footer,
  urlQuery,
  onUrlQueryChanged,
  onOpenEntity,
}: PublishedEntityListScreenProps): JSX.Element | null {
  const { schema, authKeys } = useContext(PublishedDataDataContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlQuery,
    initializeSearchEntityStateFromUrlQuery
  );

  const [entityTypeFilterState, dispatchEntityTypeFilter] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: searchEntityState.query.entityTypes },
    initializeEntityTypeSelectorState
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
  useLoadPublishedSearchEntitiesAndTotalCount(
    searchEntityState.paging ? (searchEntityState.query as PublishedSearchQuery) : undefined,
    searchEntityState.paging,
    dispatchSearchEntityState
  );

  useLoadPublishedSampleEntities(
    searchEntityState.sampling ? (searchEntityState.query as PublishedQuery) : undefined,
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
          dispatch={dispatchEntityTypeFilter}
        >
          Entity type
        </EntityTypeSelector>
        <AuthKeySelector state={authKeyFilterState} dispatch={dispatchAuthKeyFilterState}>
          Auth keys
        </AuthKeySelector>
        <IconButton icon={showMap ? 'list' : 'map'} onClick={handleToggleShowMap} />
      </FullscreenContainer.Row>
      {showMap ? (
        <FullscreenContainer.Row fillHeight fullWidth>
          <EntityMap<PublishedEntity>
            className={toSizeClassName({ height: '100%' })}
            {...{ schema, searchEntityState, dispatchSearchEntityState }}
            renderEntityMarker={(key, entity, location) => (
              <PublishedEntityMapMarker
                key={key}
                entity={entity}
                location={location}
                onClick={() => onOpenEntity(entity)}
              />
            )}
          />
        </FullscreenContainer.Row>
      ) : (
        <FullscreenContainer.ScrollableRow>
          <FullscreenContainer.Row>
            <EntityTypeTagSelector
              state={entityTypeFilterState}
              dispatch={dispatchEntityTypeFilter}
            />
            <AuthKeyTagSelector state={authKeyFilterState} dispatch={dispatchAuthKeyFilterState} />
            <PublishedEntityList
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
