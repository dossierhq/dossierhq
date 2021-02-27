import type { Location } from '@datadata/core';
import { Icon } from 'leaflet';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import type { EntityFieldEditorProps } from '../..';
import { Button, IconButton, InputText, Modal } from '../..';
import { initializeLocationState, reduceLocation } from './LocationReducer';

type Props = EntityFieldEditorProps<Location>;

const defaultCenter = { lat: 55.60498, lng: 13.003822 };

const transparentImage =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const currentMarkerIcon = new Icon({
  iconUrl: transparentImage,
  className: 'dd icon-map-marker',
  iconSize: [22, 28],
  iconAnchor: [11, 26],
});

export function LocationFieldEditor({ id, value, fieldSpec, onChange }: Props): JSX.Element {
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);

  return (
    <>
      <div style={{ display: 'flex' }}>
        <Button id={id} onClick={handleShow}>
          {value ? `${value.lat}, ${value.lng}` : 'Select location'}
        </Button>
        {value ? (
          <IconButton icon="remove" title="Remove location" onClick={() => onChange?.(null)} />
        ) : null}
      </div>
      <Modal show={show} onClose={handleClose} size="large">
        {show ? <LocationEditor value={value} onChange={onChange} /> : null}
      </Modal>
    </>
  );
}

function LocationEditor({
  value,
  onChange,
}: {
  value: Location | null;
  onChange: ((location: Location | null) => void) | undefined;
}) {
  const [{ latString, lngString }, dispatch] = useReducer(
    reduceLocation,
    { value, onChange },
    initializeLocationState
  );
  useEffect(() => {
    dispatch({ type: 'value', value });
  }, [value]);
  useEffect(() => {
    dispatch({ type: 'onChange', onChange });
  }, [onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <InputText
          value={latString}
          onChange={(lat) => dispatch({ type: 'lat', value: lat })}
          type="number"
        />
        <InputText
          value={lngString}
          onChange={(lng) => dispatch({ type: 'lng', value: lng })}
          type="number"
        />
      </div>
      <MapContainer
        center={value ?? defaultCenter}
        zoom={13}
        scrollWheelZoom
        style={{ width: '100%', flexGrow: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CurrentLocationMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
}

function CurrentLocationMarker({
  value,
  onChange,
}: {
  value: Location | null;
  onChange?: (location: Location | null) => void;
}) {
  useMapEvents({
    click: (event) => {
      onChange?.({
        lat: Math.round(event.latlng.lat * 1e6) / 1e6,
        lng: Math.round(event.latlng.lng * 1e6) / 1e6,
      });
    },
  });
  return value ? <Marker position={[value.lat, value.lng]} icon={currentMarkerIcon} /> : null;
}
