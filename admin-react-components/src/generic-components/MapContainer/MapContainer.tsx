import type { BoundingBox, Location } from '@datadata/core';
import { Icon } from 'leaflet';
import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import {
  MapContainer as LeafletMapContainer,
  Marker,
  TileLayer,
  Tooltip,
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
  onBoundingBoxChanged?: (boundingBox: BoundingBox) => void;
  children: React.ReactNode;
}

interface MarkerProps {
  location: Location;
  tooltip?: string;
  onClick?: () => void;
}

interface EditLocationMarkerProps {
  value: Location | null;
  onChange: (location: Location) => void;
}

interface MapContainerComponent extends FunctionComponent<MapContainerProps> {
  Marker: FunctionComponent<MarkerProps>;
  CurrentLocationMarker: FunctionComponent<EditLocationMarkerProps>;
}

export const MapContainer: MapContainerComponent = ({
  center,
  style,
  onBoundingBoxChanged,
  children,
}: MapContainerProps) => {
  return (
    <LeafletMapContainer center={center ?? defaultCenter} zoom={13} scrollWheelZoom style={style}>
      {onBoundingBoxChanged ? (
        <MapEventListener onBoundingBoxChanged={onBoundingBoxChanged} />
      ) : null}
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMapContainer>
  );
};
MapContainer.displayName = 'Map';

function MapEventListener({
  onBoundingBoxChanged,
}: {
  onBoundingBoxChanged: (boundingBox: BoundingBox) => void;
}) {
  const map = useMapEvents({
    moveend: (_event) => {
      const bounds = map.getBounds();
      onBoundingBoxChanged({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    },
  });

  useEffect(() => {
    const bounds = map.getBounds();
    onBoundingBoxChanged({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    });
  }, [map, onBoundingBoxChanged]);

  return null;
}

function MapContainerMarker({ location, tooltip, onClick }: MarkerProps) {
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={currentMarkerIcon}
      eventHandlers={onClick ? { click: onClick } : undefined}
    >
      {tooltip ? <Tooltip>{tooltip}</Tooltip> : null}
    </Marker>
  );
}
MapContainer.Marker = MapContainerMarker;
MapContainer.Marker.displayName = 'MapContainer.Marker';

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
