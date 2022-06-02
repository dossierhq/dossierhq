import type { LatLngBoundsLiteral } from 'leaflet';

// Copy of the relevant core types to prevent having to import core just for Map

/** Geographic location using EPSG:4326/WGS 84 */
export interface Location {
  /** South/north -90°/90° */
  lat: number;
  /** West/east -180°/180° */
  lng: number;
}

/** Geographic bounding box using EPSG:4326/WGS 84 */
export interface BoundingBox {
  /** South/north -90°/90° */
  minLat: number;
  /** South/north -90°/90° */
  maxLat: number;
  /** West/east -180°/180° */
  minLng: number;
  /** West/east -180°/180° */
  maxLng: number;
}

export function toLatLngLiteral({
  minLat,
  maxLat,
  minLng,
  maxLng,
}: BoundingBox): LatLngBoundsLiteral {
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}
