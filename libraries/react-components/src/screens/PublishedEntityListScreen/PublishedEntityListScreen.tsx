import type { PublishedEntity } from '@dossierhq/core';
import { FullscreenContainer, toSizeClassName } from '@dossierhq/design';
import React, { useCallback, useContext, useReducer, useState } from 'react';
import { PublishedEntitySearchToolbar } from '../../components/PublishedEntitySearchToolbar/PublishedEntitySearchToolbar.js';
import { PublishedEntityList } from '../../published/components/PublishedEntityList/PublishedEntityList.js';
import { PublishedEntityMapMarker } from '../../published/components/PublishedEntityMapMarker/PublishedEntityMapMarker.js';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import { usePublishedEntitySearchFilters } from '../../published/hooks/usePublishedEntitySearchFilters.js';
import { usePublishedLoadEntitySearch } from '../../published/hooks/usePublishedLoadEntitySearch.js';
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

export interface PublishedEntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
  onOpenEntity: (entity: PublishedEntity) => void;
}

export function PublishedEntityListScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
  onOpenEntity,
}: PublishedEntityListScreenProps): JSX.Element | null {
  const { schema } = useContext(PublishedDataDataContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlSearchParams,
    initializeSearchEntityStateFromUrlQuery
  );

  const {
    entityTypeFilterState,
    dispatchEntityTypeFilterState,
    authKeyFilterState,
    dispatchAuthKeyFilterState,
  } = usePublishedEntitySearchFilters(searchEntityState, dispatchSearchEntityState);

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
  usePublishedLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  const isEmpty = searchEntityState.entities?.length === 0;

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <PublishedEntitySearchToolbar
          {...{
            showMap,
            searchEntityState,
            entityTypeFilterState,
            authKeyFilterState,
            dispatchAuthKeyFilterState,
            dispatchEntityTypeFilterState,
            dispatchSearchEntityState,
            onToggleMapClick: handleToggleShowMap,
          }}
        />
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
              dispatch={dispatchEntityTypeFilterState}
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
