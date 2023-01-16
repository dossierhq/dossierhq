import type { Location, PublishedEntity } from '@dossierhq/core';
import { Column, Text } from '@dossierhq/design';
import { MapContainer } from '@jonasb/datadata-leaflet';
import type { MarkerColor } from '@jonasb/datadata-leaflet';
import React from 'react';

interface Props {
  color?: MarkerColor;
  entity: PublishedEntity;
  location: Location;
  onClick?: () => void;
}

export function PublishedEntityMapMarker({ color, entity, location, onClick }: Props) {
  return (
    <MapContainer.Marker
      color={color}
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
