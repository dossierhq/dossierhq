import type { Entity, Query } from '@jonasb/datadata-core';
import { FullscreenContainer, IconButton, toSizeClassName } from '@jonasb/datadata-design';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../../index.js';
import {
  AuthKeySelector,
  AuthKeyTagSelector,
  EntityList,
  EntityMap2,
  EntityMapMarker,
  EntityTypeSelector,
  EntityTypeTagSelector,
  initializeAuthKeySelectorState,
  initializeEntityTypeSelectorState,
  initializeSearchEntityStateFromUrlQuery,
  PublishedDataDataContext,
  reduceAuthKeySelectorState,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  SearchEntityPagingButtons,
  SearchEntityPagingCount,
  SearchEntitySearchInput,
  SearchEntityStateActions,
  useLoadSearchEntity,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../../index.js';

export interface EntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlQuery?: EntitySearchStateUrlQuery;
  onUrlQueryChanged?: (urlQuery: EntitySearchStateUrlQuery) => void;
  onOpenEntity: (entity: Entity) => void;
}

export function EntityListScreen({
  header,
  footer,
  urlQuery,
  onUrlQueryChanged,
  onOpenEntity,
}: EntityListScreenProps): JSX.Element | null {
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

  const [showMap, setShowMap] = useState(!!searchEntityState.query.boundingBox);

  const handleToggleShowMap = useCallback(() => {
    if (showMap) {
      dispatchSearchEntityState(
        new SearchEntityStateActions.SetQuery({ boundingBox: undefined }, true)
      );
    }
    setShowMap(!showMap);
  }, [showMap]);

  // sync entity type filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { entityTypes: entityTypeFilterState.selectedIds },
        true
      )
    );
  }, [entityTypeFilterState.selectedIds]);

  // sync auth key filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery({ authKeys: authKeyFilterState.selectedIds }, true)
    );
  }, [authKeyFilterState.selectedIds]);

  // sync url <-> search entity state
  useSynchronizeUrlQueryAndSearchEntityState(
    urlQuery,
    onUrlQueryChanged,
    searchEntityState,
    dispatchSearchEntityState
  );

  useLoadSearchEntity(
    searchEntityState.query as Query,
    searchEntityState.paging,
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
          <EntityMap2<Entity>
            className={toSizeClassName({ height: '100%' })}
            {...{ schema, searchEntityState, dispatchSearchEntityState }}
            renderEntityMarker={(key, entity, location) => (
              <EntityMapMarker
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
            <EntityList
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
        <SearchEntityPagingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
        <SearchEntityPagingCount {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
