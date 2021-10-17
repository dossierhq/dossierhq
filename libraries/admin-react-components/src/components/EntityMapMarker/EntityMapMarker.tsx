import type { AdminEntity, Location } from '@jonasb/datadata-core';
import React from 'react';
import { MapContainer, StatusTag } from '../../index.js';

export function EntityMapMarker({
  entity,
  location,
  onClick,
}: {
  entity: AdminEntity;
  location: Location;
  onClick: () => void;
}) {
  return (
    <MapContainer.Marker
      location={location}
      tooltip={
        <>
          {`${entity.info.type}: ${entity.info.name}`}{' '}
          <StatusTag status={entity.info.publishingState} />
        </>
      }
      onClick={onClick}
    />
  );
}
