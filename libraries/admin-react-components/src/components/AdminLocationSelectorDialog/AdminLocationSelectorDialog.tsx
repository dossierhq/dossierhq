import type { AdminEntity, AdminQuery, AdminSearchQuery, Location } from '@jonasb/datadata-core';
import {
  Dialog,
  FullscreenContainer,
  IconButton,
  Input,
  Text,
  toSizeClassName,
} from '@jonasb/datadata-design';
import React, { useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminLoadSampleEntities } from '../../hooks/useAdminLoadSampleEntities';
import { useAdminLoadSearchEntitiesAndTotalCount } from '../../hooks/useAdminLoadSearchEntitiesAndTotalCount';
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

  // Entity search state

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { actions: [new SearchEntityStateActions.SetSampling({ count: 100 }, false)] },
    initializeSearchEntityState
  );

  // load search/total or sampling
  useAdminLoadSearchEntitiesAndTotalCount(
    searchEntityState.paging ? (searchEntityState.query as AdminSearchQuery) : undefined,
    searchEntityState.paging,
    dispatchSearchEntityState
  );

  useAdminLoadSampleEntities(
    searchEntityState.sampling ? (searchEntityState.query as AdminQuery) : undefined,
    searchEntityState.sampling,
    dispatchSearchEntityState
  );

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
      </FullscreenContainer.Row>
      <FullscreenContainer.Row fillHeight fullWidth>
        <EntityMap<AdminEntity>
          className={toSizeClassName({ height: '100%' })}
          {...{ schema, searchEntityState, dispatchSearchEntityState }}
          renderEntityMarker={(key, entity, location) => (
            <AdminEntityMapMarker key={key} entity={entity} location={location} />
          )}
          center={value}
        >
          <MapContainer.EditLocationMarker value={value} onChange={onChange} />
        </EntityMap>
      </FullscreenContainer.Row>
    </>
  );
}
