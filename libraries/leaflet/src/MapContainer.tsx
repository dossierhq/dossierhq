import type { Map } from 'leaflet';
import { control } from 'leaflet';
import 'leaflet.locatecontrol';
import type { CSSProperties, FunctionComponent } from 'react';
import React, { useEffect, useRef } from 'react';
import {
  MapContainer as LeafletMapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { BoundingBox, Location } from './CoreTypes.js';
import { toLatLngLiteral } from './CoreTypes.js';
import type { MarkerColor } from './MarkerUtils.js';
import { getMarkerIcon } from './MarkerUtils.js';
import type { ZoomMetrics } from './Types.js';

const defaultZoom = 13;

export interface MapContainerProps {
  className?: string;
  style?: CSSProperties;
  center: Location;
  zoom?: number | null;
  minZoom?: number;
  /** When changed resets to the provided `center` and `zoom` values. */
  resetSignal?: unknown;
  maxBoundingBox?: BoundingBox;
  onBoundingBoxChanged?: (boundingBox: BoundingBox) => void;
  onZoomMetricsChanged?: (zoomMetrics: ZoomMetrics) => void;
  children?: React.ReactNode;
}

interface LocateControlProps {
  title?: string;
  outsideMapBoundsMsg?: string;
  showPopup?: boolean;
}

interface MarkerProps {
  color?: MarkerColor;
  location: Location;
  tooltip?: JSX.Element | string | null;
  onClick?: () => void;
}

interface EditLocationMarkerProps {
  value: Location | null;
  onChange: (location: Location) => void;
}

interface MapContainerComponent extends FunctionComponent<MapContainerProps> {
  LocateControl: FunctionComponent<LocateControlProps>;
  Marker: FunctionComponent<MarkerProps>;
  EditLocationMarker: FunctionComponent<EditLocationMarkerProps>;
}

export const MapContainer: MapContainerComponent = ({
  className,
  style,
  center,
  zoom,
  minZoom,
  resetSignal,
  maxBoundingBox,
  onBoundingBoxChanged,
  onZoomMetricsChanged,
  children,
}: MapContainerProps) => {
  const mapRef = useRef<Map>(null);

  useEffect(() => {
    if (resetSignal && mapRef.current) {
      mapRef.current.setView(center, zoom ?? defaultZoom, { animate: true });
    }
  }, [resetSignal]);

  useEffect(() => {
    // Fix issue where tiles are sometimes not loaded on initial display
    // https://github.com/PaulLeCam/react-leaflet/issues/340
    setTimeout(() => mapRef.current?.invalidateSize(), 0);
  }, []);

  return (
    <LeafletMapContainer
      ref={mapRef}
      className={className}
      style={style}
      center={center}
      zoom={zoom ?? defaultZoom}
      minZoom={minZoom}
      maxBounds={maxBoundingBox ? toLatLngLiteral(maxBoundingBox) : undefined}
      scrollWheelZoom
    >
      {onBoundingBoxChanged || onZoomMetricsChanged ? (
        <MapEventListener
          onBoundingBoxChanged={onBoundingBoxChanged}
          onZoomMetricsChanged={onZoomMetricsChanged}
        />
      ) : null}
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMapContainer>
  );
};
MapContainer.displayName = 'MapContainer';

function MapEventListener({
  onBoundingBoxChanged,
  onZoomMetricsChanged,
}: {
  onBoundingBoxChanged?: (boundingBox: BoundingBox) => void;
  onZoomMetricsChanged?: (metrics: ZoomMetrics) => void;
}) {
  const map = useMapEvents({
    ...(onBoundingBoxChanged
      ? {
          move: (_event) => {
            onBoundingBoxChanged(getBoundingBox(map));
          },
        }
      : {}),
    ...(onZoomMetricsChanged
      ? {
          zoom: (_event) => {
            onZoomMetricsChanged(getZoomMetrics(map));
          },
        }
      : {}),
  });

  useEffect(() => {
    if (onBoundingBoxChanged) onBoundingBoxChanged(getBoundingBox(map));
    if (onZoomMetricsChanged) onZoomMetricsChanged(getZoomMetrics(map));
  }, [map, onBoundingBoxChanged, onZoomMetricsChanged]);

  return null;
}

function getBoundingBox(map: Map) {
  const bounds = map.getBounds();
  const boundingBox: BoundingBox = {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast(),
  };
  return boundingBox;
}

function getZoomMetrics(map: Map) {
  const location0 = map.containerPointToLatLng([0, 0]);
  const location1 = map.containerPointToLatLng([1, 1]);
  const metrics: ZoomMetrics = {
    pixelToLat: location0.lat - location1.lat,
    pixelToLng: location1.lng - location0.lng,
  };
  return metrics;
}

function LocateControl({ outsideMapBoundsMsg, showPopup, title }: LocateControlProps) {
  const map = useMap();
  useEffect(() => {
    const strings: Record<string, string> = {};
    if (outsideMapBoundsMsg) strings.outsideMapBoundsMsg = outsideMapBoundsMsg;
    if (title) strings.title = title;

    const locateControl = control.locate({
      icon: 'icon-map-location leaflet-icon',
      iconLoading: 'icon-map-location leaflet-icon is-pulsing',
      showPopup,
      strings,
    });
    map.addControl(locateControl);
    return () => {
      map.removeControl(locateControl);
    };
  }, [map, outsideMapBoundsMsg, showPopup, title]);
  return null;
}
MapContainer.LocateControl = LocateControl;
MapContainer.LocateControl.displayName = 'MapContainer.LocateControl';

function MapContainerMarker({ color, location, tooltip, onClick }: MarkerProps) {
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={getMarkerIcon(color)}
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
  return value ? (
    <Marker position={[value.lat, value.lng]} icon={getMarkerIcon('current')} />
  ) : null;
}
MapContainer.EditLocationMarker = EditLocationMarker;
MapContainer.EditLocationMarker.displayName = 'MapContainer.EditLocationMarker';
