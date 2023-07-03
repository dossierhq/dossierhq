import type { EntityReference, PublishedEntity } from '@dossierhq/core';
import { Dialog2, FullscreenContainer, IconButton, Text, toSizeClassName } from '@dossierhq/design';
import { useCallback, useContext, useReducer, useState } from 'react';
import { PublishedEntityList } from '../../published/components/PublishedEntityList/PublishedEntityList.js';
import { PublishedEntityMapMarker } from '../../published/components/PublishedEntityMapMarker/PublishedEntityMapMarker.js';
import { PublishedDossierContext } from '../../published/contexts/PublishedDossierContext.js';
import { usePublishedEntitySearchFilters } from '../../published/hooks/usePublishedEntitySearchFilters.js';
import { usePublishedLoadEntitySearch } from '../../published/hooks/usePublishedLoadEntitySearch.js';
import { AuthKeyTagSelector } from '../../shared/components/AuthKeyTagSelector/AuthKeyTagSelector.js';
import { EntityMap } from '../../shared/components/EntityMap/EntityMap.js';
import { SearchOrSampleEntitiesButtons } from '../../shared/components/SearchOrSampleEntitiesButtons/SearchOrSampleEntitiesButtons.js';
import { TypeTagSelector } from '../../shared/components/TypeTagSelector/TypeTagSelector.js';
import {
  SearchEntityStateActions,
  initializeSearchEntityState,
  reduceSearchEntityState,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { PublishedEntitySearchToolbar } from '../PublishedEntitySearchToolbar/PublishedEntitySearchToolbar.js';

interface PublishedEntitySelectorDialogProps {
  title: string;
  entityTypes?: string[];
  linksFrom?: EntityReference;
  linksTo?: EntityReference;
  onItemClick: (item: PublishedEntity) => void;
}

export function PublishedEntitySelectorDialog({
  title,
  entityTypes,
  linksFrom,
  linksTo,
  onItemClick,
}: PublishedEntitySelectorDialogProps) {
  return (
    <Dialog2 width="wide" height="fill">
      {({ close }) => (
        <FullscreenContainer card height="100%">
          <FullscreenContainer.Row flexDirection="row" alignItems="center">
            <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
              <Text textStyle="headline5">{title}</Text>
            </FullscreenContainer.Item>
            <IconButton icon="close" color="white" onClick={close} />
          </FullscreenContainer.Row>
          <Content
            entityTypes={entityTypes}
            linksFrom={linksFrom}
            linksTo={linksTo}
            onItemClick={onItemClick}
          />
        </FullscreenContainer>
      )}
    </Dialog2>
  );
}

function Content({
  entityTypes,
  linksFrom,
  linksTo,
  onItemClick,
}: {
  entityTypes: string[] | undefined;
  linksFrom: EntityReference | undefined;
  linksTo: EntityReference | undefined;
  onItemClick: (item: PublishedEntity) => void;
}) {
  const { schema } = useContext(PublishedDossierContext);

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    {
      mode: 'published',
      restrictEntityTypes: entityTypes,
      restrictLinksFrom: linksFrom,
      restrictLinksTo: linksTo,
    },
    initializeSearchEntityState
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
          { partial: true, resetPagingIfModifying: true }
        )
      );
    }
    setShowMap(!showMap);
  }, [showMap]);

  // load search/total or sampling
  usePublishedLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  return (
    <>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <PublishedEntitySearchToolbar
          {...{
            showMap,
            searchEntityState,
            typeFilterState,
            authKeyFilterState,
            dispatchSearchEntityState,
            dispatchTypeFilterState,
            dispatchAuthKeyFilterState,
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
              <TypeTagSelector state={typeFilterState} dispatch={dispatchTypeFilterState} />
              <AuthKeyTagSelector
                state={authKeyFilterState}
                dispatch={dispatchAuthKeyFilterState}
              />
            </FullscreenContainer.Item>
            <PublishedEntityList
              {...{ searchEntityState, dispatchSearchEntityState, onItemClick }}
            />
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
