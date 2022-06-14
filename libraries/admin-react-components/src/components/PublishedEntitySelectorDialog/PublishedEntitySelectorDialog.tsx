import type { EntityReference, PublishedEntity } from '@jonasb/datadata-core';
import {
  Dialog,
  FullscreenContainer,
  IconButton,
  Text,
  toSizeClassName,
} from '@jonasb/datadata-design';
import { useCallback, useContext, useReducer, useState } from 'react';
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
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { PublishedEntitySearchToolbar } from '../PublishedEntitySearchToolbar/PublishedEntitySearchToolbar.js';

interface PublishedEntitySelectorDialogProps {
  show: boolean;
  title: string;
  entityTypes?: string[];
  linksFrom?: EntityReference;
  linksTo?: EntityReference;
  onClose: () => void;
  onItemClick: (item: PublishedEntity) => void;
}

export function PublishedEntitySelectorDialog({
  show,
  title,
  entityTypes,
  linksFrom,
  linksTo,
  onClose,
  onItemClick,
}: PublishedEntitySelectorDialogProps) {
  return (
    <Dialog show={show} modal onClose={onClose} width="wide" height="fill">
      <FullscreenContainer card height="100%">
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
            <Text textStyle="headline5">{title}</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" onClick={onClose} />
        </FullscreenContainer.Row>
        {show ? (
          <Content
            entityTypes={entityTypes}
            linksFrom={linksFrom}
            linksTo={linksTo}
            onItemClick={onItemClick}
          />
        ) : null}
      </FullscreenContainer>
    </Dialog>
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
  const { schema } = useContext(PublishedDataDataContext);

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { restrictEntityTypes: entityTypes, restrictLinksFrom: linksFrom, restrictLinksTo: linksTo },
    initializeSearchEntityState
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

  // load search/total or sampling
  usePublishedLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  return (
    <>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <PublishedEntitySearchToolbar
          {...{
            showMap,
            searchEntityState,
            entityTypeFilterState,
            authKeyFilterState,
            dispatchSearchEntityState,
            dispatchEntityTypeFilterState,
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
              <EntityTypeTagSelector
                state={entityTypeFilterState}
                dispatch={dispatchEntityTypeFilterState}
              />
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
