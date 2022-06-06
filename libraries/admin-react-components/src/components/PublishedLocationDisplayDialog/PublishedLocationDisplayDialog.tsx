import type { Location, PublishedEntity } from '@jonasb/datadata-core';
import {
  Dialog,
  FullscreenContainer,
  IconButton,
  Input,
  Text,
  toSizeClassName,
} from '@jonasb/datadata-design';
import React, { useCallback, useContext, useReducer, useState } from 'react';
import { PublishedEntityMapMarker } from '../../published/components/PublishedEntityMapMarker/PublishedEntityMapMarker.js';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import { usePublishedLoadEntitySearch } from '../../published/hooks/usePublishedLoadEntitySearch.js';
import {
  EntityMap,
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from '../../shared';

interface PublishedLocationDisplayDialogProps {
  show: boolean;
  title: string;
  value: Location;
  onClose: () => void;
}

export function PublishedLocationDisplayDialog({
  show,
  title,
  value,
  onClose,
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
        {show ? <Content value={value} /> : null}
      </FullscreenContainer>
    </Dialog>
  );
}

function Content({ value }: { value: Location }) {
  const { schema } = useContext(PublishedDataDataContext);

  // Reset signal

  const [resetSignal, setResetSignal] = useState(0);
  const handleResetClick = useCallback(() => setResetSignal((it) => it + 1), []);

  // Entity search state

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { actions: [new SearchEntityStateActions.SetSampling({ count: 100 }, false)] },
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
            />
          )}
          center={value}
          resetSignal={resetSignal}
        />
      </FullscreenContainer.Row>
    </>
  );
}
