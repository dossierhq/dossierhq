import type { Entity, Location } from '@dossierhq/core';
import { Column, Text } from '@dossierhq/design';
import { MapContainer } from '@dossierhq/leaflet';
import { StatusTag } from '../StatusTag/StatusTag.js';

interface Props {
  entity: Entity;
  location: Location;
  onClick?: () => void;
}

export function AdminEntityMapMarker({ entity, location, onClick }: Props) {
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
