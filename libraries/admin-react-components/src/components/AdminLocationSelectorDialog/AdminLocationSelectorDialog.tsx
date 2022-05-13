import type { AdminEntity, Location } from '@jonasb/datadata-core';
import {
  Dialog,
  FullscreenContainer,
  IconButton,
  Input,
  Text,
  toSizeClassName,
} from '@jonasb/datadata-design';
import React, { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminLoadEntitySearch } from '../../hooks/useAdminLoadEntitySearch';
import {
  EntityMap,
  initializeSearchEntityState,
  MapContainer,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from '../../shared';
import { AdminEntityMapMarker } from '../AdminEntityMapMarker/AdminEntityMapMarker';
import { initializeLocationState, reduceLocation } from './LocationReducer';

interface AdminLocationSelectorDialogProps {
  show: boolean;
  title: string;
  value: Location | null;
  onChange: (location: Location | null) => void;
  onClose: () => void;
}

export function AdminLocationSelectorDialog({
  show,
  title,
  value,
  onClose,
  onChange,
}: AdminLocationSelectorDialogProps) {
  return (
    <Dialog show={show} modal onClose={onClose} width="wide" height="fill">
      <FullscreenContainer card height="100%">
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
            <Text textStyle="headline5">{title}</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" onClick={onClose} />
        </FullscreenContainer.Row>
        {show ? <Content value={value} onChange={onChange} /> : null}
      </FullscreenContainer>
    </Dialog>
  );
}

function Content({
  value,
  onChange,
}: {
  value: Location | null;
  onChange: (location: Location | null) => void;
}) {
  const { schema } = useContext(AdminDataDataContext);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Lat, lng state
  const [{ latString, lngString }, dispatch] = useReducer(
    reduceLocation,
    { value, onChangeRef },
    initializeLocationState
  );
  useEffect(() => {
    dispatch({ type: 'value', value });
  }, [value]);

  const handleLatChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void =>
      dispatch({ type: 'lat', value: event.currentTarget.value }),
    []
  );

  const handleLngChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void =>
      dispatch({ type: 'lng', value: event.currentTarget.value }),
    []
  );

  // Reset signal

  const [resetSignal, setResetSignal] = useState(0);
  const handleResetClick = useCallback(() => setResetSignal((it) => it + 1), []);

  // Entity search state

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { actions: [new SearchEntityStateActions.SetSampling({ count: 100 }, false)] },
    initializeSearchEntityState
  );

  // load search/total or sampling
  useAdminLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  return (
    <>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <Input
          value={latString}
          onChange={handleLatChange}
          type="number"
          min={-90.0}
          max={90.0}
          step={0.000001}
        />
        <Input
          value={lngString}
          onChange={handleLngChange}
          type="number"
          min={-180.0}
          max={180.0}
          step={0.000001}
        />
        <IconButton disabled={!value} icon="location" onClick={handleResetClick} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row fillHeight fullWidth>
        <EntityMap<AdminEntity>
          className={toSizeClassName({ height: '100%' })}
          {...{ schema, searchEntityState, dispatchSearchEntityState }}
          renderEntityMarker={(key, entity, location) => (
            <AdminEntityMapMarker key={key} entity={entity} location={location} />
          )}
          center={value}
          resetSignal={resetSignal}
        >
          <MapContainer.EditLocationMarker value={value} onChange={onChange} />
        </EntityMap>
      </FullscreenContainer.Row>
    </>
  );
}
