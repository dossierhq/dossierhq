'use client';
import type { PublishedEntity } from '@dossierhq/core';
import { FullscreenContainer, toSizeClassName } from '@dossierhq/design';
import { useCallback, useContext, useReducer, useState, type ReactNode } from 'react';
import { PublishedEntityList } from '../../components/PublishedEntityList/PublishedEntityList.js';
import { PublishedEntityMapMarker } from '../../components/PublishedEntityMapMarker/PublishedEntityMapMarker.js';
import { PublishedEntitySearchToolbar } from '../../components/PublishedEntitySearchToolbar/PublishedEntitySearchToolbar.js';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { usePublishedEntitySearchFilters } from '../../hooks/usePublishedEntitySearchFilters.js';
import { usePublishedLoadEntitySearch } from '../../hooks/usePublishedLoadEntitySearch.js';
import {
  SearchEntityStateActions,
  reduceSearchEntityState,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import {
  initializeSearchEntityStateFromUrlQuery,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../../reducers/SearchEntityReducer/SearchEntityUrlSynchronizer.js';
import { AuthKeyTagSelector } from '../../components/AuthKeyTagSelector/AuthKeyTagSelector.js';
import { EntityMap } from '../../components/EntityMap/EntityMap.js';
import { SearchOrSampleEntitiesButtons } from '../../components/SearchOrSampleEntitiesButtons/SearchOrSampleEntitiesButtons.js';
import { TypeTagSelector } from '../../components/TypeTagSelector/TypeTagSelector.js';

export interface PublishedContentListScreenProps {
  header?: ReactNode;
  footer?: ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
  onOpenEntity: (entity: PublishedEntity) => void;
}

export function PublishedContentListScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
  onOpenEntity,
}: PublishedContentListScreenProps): JSX.Element | null {
  const { schema } = useContext(PublishedDossierContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { mode: 'published', urlSearchParams },
    initializeSearchEntityStateFromUrlQuery,
  );

  const {
    typeFilterState,
    dispatchTypeFilterState,
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
          { partial: true, resetPagingIfModifying: true },
        ),
      );
    }
    setShowMap(!showMap);
  }, [showMap]);

  // sync url <-> search entity state
  useSynchronizeUrlQueryAndSearchEntityState(
    'published',
    urlSearchParams,
    onUrlSearchParamsChange,
    searchEntityState,
    dispatchSearchEntityState,
  );

  // load search/total or sampling
  usePublishedLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  const isEmpty = searchEntityState.entities?.length === 0;

  const showAuthKeys = !!schema && schema.spec.entityTypes.some((it) => !!it.authKeyPattern);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row flexDirection="row" gap={2} padding={2}>
        <PublishedEntitySearchToolbar
          {...{
            showMap,
            searchEntityState,
            typeFilterState,
            authKeyFilterState,
            showAuthKeys,
            dispatchAuthKeyFilterState,
            dispatchTypeFilterState,
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
          <FullscreenContainer.Row height={isEmpty ? '100%' : undefined} paddingHorizontal={2}>
            <FullscreenContainer.Item paddingHorizontal={3}>
              <TypeTagSelector state={typeFilterState} dispatch={dispatchTypeFilterState} />
              <AuthKeyTagSelector
                state={authKeyFilterState}
                dispatch={dispatchAuthKeyFilterState}
              />
            </FullscreenContainer.Item>
            <PublishedEntityList
              {...{ searchEntityState, dispatchSearchEntityState, showAuthKeys }}
              onItemClick={onOpenEntity}
            />
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      )}
      <FullscreenContainer.Row padding={2} columnGap={2} flexDirection="row" alignItems="center">
        <SearchOrSampleEntitiesButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
