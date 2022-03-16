import type { Location, PublishedEntity } from '@jonasb/datadata-core';
import { Column, Text } from '@jonasb/datadata-design';
import React from 'react';
import { MapContainer } from '../../..';

export function EntityMapMarker({
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
