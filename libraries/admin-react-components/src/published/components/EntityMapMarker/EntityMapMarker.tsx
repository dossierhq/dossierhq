import type { Entity, Location } from '@jonasb/datadata-core';
import React from 'react';
import { MapContainer } from '../../../index.js';

export function EntityMapMarker({
  entity,
  location,
  onClick,
}: {
  entity: Entity;
  location: Location;
  onClick: () => void;
}) {
  return (
    <MapContainer.Marker
      location={location}
      tooltip={<>{`${entity.info.type}: ${entity.info.name}`}</>}
      onClick={onClick}
    />
  );
}
