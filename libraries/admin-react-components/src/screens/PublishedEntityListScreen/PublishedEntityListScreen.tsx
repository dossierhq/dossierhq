import type { PublishedEntity } from '@jonasb/datadata-core';
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
import { PublishedEntityList } from '../../published/components/PublishedEntityList/PublishedEntityList.js';
import { PublishedEntityMapMarker } from '../../published/components/PublishedEntityMapMarker/PublishedEntityMapMarker.js';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import { usePublishedLoadEntitySearch } from '../../published/hooks/usePublishedLoadEntitySearch.js';

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
  usePublishedLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  const isEmpty = searchEntityState.entities?.length === 0;

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
        <FullscreenContainer.ScrollableRow
          scrollToTopSignal={searchEntityState.entitiesScrollToTopSignal}
          shadows="bottom"
        >
          <FullscreenContainer.Row height={isEmpty ? '100%' : undefined}>
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
