import type { BoundingBox, Location } from '@dossierhq/core';

/** Random bounding box (which doesn't wrap 180/-180 longitude to make calculations easier) */
export function randomBoundingBox(heightLat = 1.0, widthLng = 1.0): BoundingBox {
  function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  const minLat = randomInRange(-90, 90 - heightLat);
  const minLng = randomInRange(-180, 180 - widthLng);
  const maxLat = minLat + heightLat;
  const maxLng = minLng + widthLng;
  return { minLat, maxLat, minLng, maxLng };
}

export function boundingBoxCenter(boundingBox: BoundingBox): Location {
  return {
    lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
    lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
  };
}

export function boundingBoxBelowCenter(boundingBox: BoundingBox): Location {
  const center = boundingBoxCenter(boundingBox);
  return {
    lat: center.lat,
    lng: (center.lng + boundingBox.maxLng) / 2,
  };
}
