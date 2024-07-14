import type { Entity, Location } from '@dossierhq/core';
import { MapContainer } from '@dossierhq/leaflet';

interface Props {
  entity: Entity;
  location: Location;
  onClick?: () => void;
}

export function ContentMapMarker({ entity, location, onClick }: Props) {
  return (
    <MapContainer.Marker
      location={location}
      tooltip={
        <div>
          <p>{entity.info.name}</p>
          <p>
            {entity.info.type}
            {/* <StatusTag status={entity.info.status} /> */}
          </p>
        </div>
      }
      onClick={onClick}
    />
  );
}
