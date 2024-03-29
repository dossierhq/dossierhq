import type { Location, PublishedEntity } from '@dossierhq/core';
import {
  Dialog2,
  FullscreenContainer,
  IconButton,
  Input,
  Text,
  toSizeClassName,
} from '@dossierhq/design';
import { useCallback, useContext, useReducer, useState } from 'react';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { usePublishedLoadEntitySearch } from '../../hooks/usePublishedLoadEntitySearch.js';
import {
  SearchEntityStateActions,
  initializeSearchEntityState,
  reduceSearchEntityState,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { EntityMap } from '../EntityMap/EntityMap.js';
import { PublishedEntityMapMarker } from '../PublishedEntityMapMarker/PublishedEntityMapMarker.js';

interface PublishedLocationDisplayDialogProps {
  title: string;
  value: Location;
  onEntityClick?: (entity: PublishedEntity) => void;
}

export function PublishedLocationDisplayDialog({
  title,
  value,
  onEntityClick,
}: PublishedLocationDisplayDialogProps) {
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
          <Content value={value} onEntityClick={onEntityClick} />
        </FullscreenContainer>
      )}
    </Dialog2>
  );
}

function Content({
  value,
  onEntityClick,
}: {
  value: Location;
  onEntityClick?: (entity: PublishedEntity) => void;
}) {
  const { schema } = useContext(PublishedDossierContext);

  // Reset signal

  const [resetSignal, setResetSignal] = useState(0);
  const handleResetClick = useCallback(() => setResetSignal((it) => it + 1), []);

  // Entity search state

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    {
      mode: 'published',
      actions: [new SearchEntityStateActions.SetSampling({ count: 100 }, false)],
    },
    initializeSearchEntityState,
  );

  usePublishedLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  return (
    <>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <Input value={String(value.lat ?? '')} type="number" readOnly />
        <Input value={String(value.lng ?? '')} readOnly type="number" />
        <IconButton disabled={!value} icon="location" onClick={handleResetClick} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row fillHeight fullWidth>
        <EntityMap<PublishedEntity>
          className={toSizeClassName({ height: '100%' })}
          {...{ schema, searchEntityState, dispatchSearchEntityState }}
          renderEntityMarker={(key, entity, location) => (
            <PublishedEntityMapMarker
              key={key}
              entity={entity}
              location={location}
              color={
                location.lat === value.lat && location.lng === value.lng ? 'current' : undefined
              }
              onClick={onEntityClick ? () => onEntityClick(entity) : undefined}
            />
          )}
          center={value}
          resetSignal={resetSignal}
        />
      </FullscreenContainer.Row>
    </>
  );
}
