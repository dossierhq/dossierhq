import type {
  AdminEntity,
  AdminSchema,
  Location,
  PublishedEntity,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { isLocationItemField, visitItemRecursively } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import React from 'react';
import { SearchEntityStateActions } from '../..';
import type { SearchEntityState, SearchEntityStateAction } from '../../..';
import { MapContainer } from '../../..';

export interface EntityMapProps<TEntity> {
  className?: string;
  schema: AdminSchema | PublishedSchema | undefined;
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  renderEntityMarker: (key: string, entity: TEntity, location: Location) => JSX.Element;
}

export function EntityMap2<TEntity extends AdminEntity | PublishedEntity>({
  className,
  schema,
  searchEntityState,
  dispatchSearchEntityState,
  renderEntityMarker,
}: EntityMapProps<TEntity>): JSX.Element | null {
  const { entities } = searchEntityState;

  return (
    <MapContainer
      className={className}
      center={null}
      onBoundingBoxChanged={(boundingBox) =>
        dispatchSearchEntityState(
          new SearchEntityStateActions.SetQuery(
            { boundingBox },
            { partial: true, resetPagingIfModifying: true }
          )
        )
      }
    >
      {schema
        ? entities.map((entityResult) => {
            if (entityResult.isError()) {
              return null;
            }
            const entity = entityResult.value;
            const locations = extractEntityLocations(schema, entity);
            return locations.map((location, locationIndex) =>
              renderEntityMarker(`${entity.id}-${locationIndex}`, entity as TEntity, location)
            );
          })
        : null}
    </MapContainer>
  );
}

function extractEntityLocations(
  schema: AdminSchema | PublishedSchema,
  entity: AdminEntity | PublishedEntity
) {
  const locations: Location[] = [];
  visitItemRecursively({
    schema,
    item: entity,
    visitField: (_path, fieldSpec, data, _visitContext) => {
      if (isLocationItemField(fieldSpec, data) && data) {
        locations.push(data);
      }
    },
    visitRichTextBlock: (_path, _fieldSpec, _block, _visitContext) => {
      //empty
    },
    initialVisitContext: undefined,
  });
  return locations;
}
