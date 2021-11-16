import type { BoundingBox, Location } from '@jonasb/datadata-core';
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

//TODO make configurable through a context. also max bounds
const defaultCenter = { lat: 55.60498, lng: 13.003822 } as const;
const defaultZoom = 13;

const transparentImage =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const currentMarkerIcon = new Icon({
  iconUrl: transparentImage,
  className: 'dd-icon-map-marker',
  iconSize: [22, 28],
  iconAnchor: [11, 26],
});

export interface MapContainerProps {
  className?: string;
  center?: Location | null;
  zoom?: number | null;
  onBoundingBoxChanged?: (boundingBox: BoundingBox) => void;
  children: React.ReactNode;
}

interface MarkerProps {
  location: Location;
  tooltip?: JSX.Element;
  onClick?: () => void;
}

interface EditLocationMarkerProps {
  value: Location | null;
  onChange: (location: Location) => void;
}

interface MapContainerComponent extends FunctionComponent<MapContainerProps> {
  Marker: FunctionComponent<MarkerProps>;
  EditLocationMarker: FunctionComponent<EditLocationMarkerProps>;
}

export const MapContainer: MapContainerComponent = ({
  className,
  center,
  zoom,
  onBoundingBoxChanged,
  children,
}: MapContainerProps) => {
  return (
    <LeafletMapContainer
      className={className}
      center={center ?? defaultCenter}
      zoom={zoom ?? defaultZoom}
      scrollWheelZoom
    >
      {onBoundingBoxChanged ? (
        <MapEventListener onBoundingBoxChanged={onBoundingBoxChanged} />
      ) : null}
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
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
MapContainer.EditLocationMarker = EditLocationMarker;
MapContainer.EditLocationMarker.displayName = 'MapContainer.EditLocationMarker';
