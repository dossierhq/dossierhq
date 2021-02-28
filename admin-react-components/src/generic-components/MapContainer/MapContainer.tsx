import type { Location } from '@datadata/core';
import { Icon } from 'leaflet';
import type { FunctionComponent } from 'react';
import React from 'react';
import {
  MapContainer as LeafletMapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';

const defaultCenter = { lat: 55.60498, lng: 13.003822 };

const transparentImage =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const currentMarkerIcon = new Icon({
  iconUrl: transparentImage,
  className: 'dd icon-map-marker',
  iconSize: [22, 28],
  iconAnchor: [11, 26],
});

export interface MapContainerProps {
  center: Location | null;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

interface EditLocationMarkerProps {
  value: Location | null;
  onChange: (location: Location) => void;
}

interface MapContainerComponent extends FunctionComponent<MapContainerProps> {
  CurrentLocationMarker: FunctionComponent<EditLocationMarkerProps>;
}

export const MapContainer: MapContainerComponent = ({
  center,
  style,
  children,
}: MapContainerProps) => {
  return (
    <LeafletMapContainer center={center ?? defaultCenter} zoom={13} scrollWheelZoom style={style}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMapContainer>
  );
};
MapContainer.displayName = 'Map';

function EditLocationMarker({ value, onChange }: EditLocationMarkerProps): JSX.Element | null {
  useMapEvents({
    click: (event) => {
      onChange({
        lat: Math.round(event.latlng.lat * 1e6) / 1e6,
        lng: Math.round(event.latlng.lng * 1e6) / 1e6,
      });
    },
  });
  return value ? <Marker position={[value.lat, value.lng]} icon={currentMarkerIcon} /> : null;
}
MapContainer.CurrentLocationMarker = EditLocationMarker;
MapContainer.CurrentLocationMarker.displayName = 'MapContainer.CurrentLocationMarker';
