import type { AdminEntity, Location } from '@jonasb/datadata-core';
import { Column, Text } from '@jonasb/datadata-design';
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
        <Column>
          <Text textStyle="subtitle1">{entity.info.name}</Text>
          <Text textStyle="body1">
            {entity.info.type} <StatusTag status={entity.info.status} />
          </Text>
        </Column>
      }
      onClick={onClick}
    />
  );
}
