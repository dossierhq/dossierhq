'use client';
import type { AdminEntity } from '@dossierhq/core';
import { FullscreenContainer, toSizeClassName } from '@dossierhq/design';
import { useCallback, useContext, useReducer, useState, type ReactNode } from 'react';
import { AdminEntityList } from '../../components/AdminEntityList/AdminEntityList.js';
import { AdminEntityMapMarker } from '../../components/AdminEntityMapMarker/AdminEntityMapMarker.js';
import { AdminEntitySearchToolbar } from '../../components/AdminEntitySearchToolbar/AdminEntitySearchToolbar.js';
import { StatusTagSelector } from '../../components/StatusTagSelector/StatusTagSelector.js';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { useAdminEntitySearchFilters } from '../../hooks/useAdminEntitySearchFilters.js';
import { useAdminLoadEntitySearch } from '../../hooks/useAdminLoadEntitySearch.js';
import {
  SearchEntityStateActions,
  reduceSearchEntityState,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import {
  initializeSearchEntityStateFromUrlQuery,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../../reducers/SearchEntityReducer/SearchEntityUrlSynchronizer.js';
import { AuthKeyTagSelector } from '../../shared/components/AuthKeyTagSelector/AuthKeyTagSelector.js';
import { EntityMap } from '../../shared/components/EntityMap/EntityMap.js';
import { SearchOrSampleEntitiesButtons } from '../../shared/components/SearchOrSampleEntitiesButtons/SearchOrSampleEntitiesButtons.js';
import { TypeTagSelector } from '../../shared/components/TypeTagSelector/TypeTagSelector.js';

export interface ContentListScreenProps {
  header?: ReactNode;
  footer?: ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
  onCreateEntity: (entityType: string) => void;
  onOpenEntity: (entity: AdminEntity) => void;
}

export function ContentListScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
  onCreateEntity,
  onOpenEntity,
}: ContentListScreenProps): JSX.Element | null {
  const { schema } = useContext(AdminDossierContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { mode: 'admin', urlSearchParams },
    initializeSearchEntityStateFromUrlQuery,
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

  // sync url <-> search entity state
  useSynchronizeUrlQueryAndSearchEntityState(
    'admin',
    urlSearchParams,
    onUrlSearchParamsChange,
    searchEntityState,
    dispatchSearchEntityState,
  );

  // load search/total or sampling
  useAdminLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  const isEmpty = searchEntityState.entities?.length === 0;

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.ScrollableRow direction="horizontal">
        <FullscreenContainer.Row center flexDirection="row" gap={2} padding={2}>
          <AdminEntitySearchToolbar
            {...{
              showMap,
              searchEntityState,
              dispatchSearchEntityState,
              onToggleMapClick: handleToggleShowMap,
              onCreateEntity,
              typeFilterState,
              dispatchTypeFilterState,
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
              <TypeTagSelector state={typeFilterState} dispatch={dispatchTypeFilterState} />
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
      <FullscreenContainer.Row padding={2} columnGap={2} flexDirection="row" alignItems="center">
        <SearchOrSampleEntitiesButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
