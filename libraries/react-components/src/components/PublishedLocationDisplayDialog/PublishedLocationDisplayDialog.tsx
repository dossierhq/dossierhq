import type { Location, PublishedEntity } from '@dossierhq/core';
import {
  Dialog,
  FullscreenContainer,
  IconButton,
  Input,
  Text,
  toSizeClassName,
} from '@dossierhq/design';
import React, { useCallback, useContext, useReducer, useState } from 'react';
import { PublishedEntityMapMarker } from '../../published/components/PublishedEntityMapMarker/PublishedEntityMapMarker.js';
import { PublishedDossierContext } from '../../published/contexts/PublishedDossierContext.js';
import { usePublishedLoadEntitySearch } from '../../published/hooks/usePublishedLoadEntitySearch.js';
import { EntityMap } from '../../shared/components/EntityMap/EntityMap.js';
import {
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';

interface PublishedLocationDisplayDialogProps {
  show: boolean;
  title: string;
  value: Location;
  onClose: () => void;
  onEntityClick?: (entity: PublishedEntity) => void;
}

export function PublishedLocationDisplayDialog({
  show,
  title,
  value,
  onClose,
  onEntityClick,
}: PublishedLocationDisplayDialogProps) {
  return (
    <Dialog show={show} modal onClose={onClose} width="wide" height="fill">
      <FullscreenContainer card height="100%">
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
            <Text textStyle="headline5">{title}</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" onClick={onClose} />
        </FullscreenContainer.Row>
        {show ? <Content value={value} onEntityClick={onEntityClick} /> : null}
      </FullscreenContainer>
    </Dialog>
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
    initializeSearchEntityState
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
