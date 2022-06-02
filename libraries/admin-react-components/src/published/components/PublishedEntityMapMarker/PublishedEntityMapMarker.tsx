import type { Location, PublishedEntity } from '@jonasb/datadata-core';
import { Column, Text } from '@jonasb/datadata-design';
import { MapContainer } from '@jonasb/datadata-leaflet';
import React from 'react';

export function PublishedEntityMapMarker({
  entity,
  location,
  onClick,
}: {
  entity: PublishedEntity;
  location: Location;
  onClick: () => void;
}) {
  return (
    <MapContainer.Marker
      location={location}
      tooltip={
        <Column>
          <Text textStyle="subtitle1">{entity.info.name}</Text>
          <Text textStyle="body1">{entity.info.type}</Text>
        </Column>
      }
      onClick={onClick}
    />
  );
}
