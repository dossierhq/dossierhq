import { Icon } from 'leaflet';
import type { BoundingBox } from './CoreTypes.js';
import type { ZoomMetrics } from './Types.js';

export type MarkerColor = 'current' | 'default';

const transparentImage =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const markerIcon = new Icon({
  iconUrl: transparentImage,
  className: 'icon-map-marker',
  iconSize: [22, 28],
  iconAnchor: [11, 27],
});

const currentMarkerIcon = new Icon({
  iconUrl: transparentImage,
  className: 'icon-map-marker-current',
  iconSize: [22, 28],
  iconAnchor: [11, 27],
});

const markerIconStats = (() => {
  let maxLeft = 0;
  let maxRight = 0;
  let maxTop = 0;
  let maxBottom = 0;
  for (const icon of [markerIcon, currentMarkerIcon]) {
    const [width, height] = icon.options.iconSize;
    const [x, y] = icon.options.iconAnchor;
    maxLeft = Math.max(maxLeft, x);
    maxRight = Math.max(maxRight, width - x);
    maxTop = Math.max(maxTop, y);
    maxBottom = Math.max(maxBottom, height - y);
  }
  return { maxLeft, maxRight, maxTop, maxBottom };
})();

export function getMarkerIcon(color: MarkerColor | undefined) {
  return color === 'current' ? currentMarkerIcon : markerIcon;
}

export function expandBoundingBoxForMarkers(
  boundingBox: BoundingBox,
  zoomMetrics: ZoomMetrics,
): BoundingBox {
  const { maxLeft, maxRight, maxTop, maxBottom } = markerIconStats;
  const result = {
    minLat: boundingBox.minLat - zoomMetrics.pixelToLat * maxTop,
    maxLat: boundingBox.maxLat + zoomMetrics.pixelToLat * maxBottom,
    minLng: boundingBox.minLng - zoomMetrics.pixelToLat * maxLeft,
    maxLng: boundingBox.maxLng + zoomMetrics.pixelToLat * maxRight,
  };
  return result;
}
