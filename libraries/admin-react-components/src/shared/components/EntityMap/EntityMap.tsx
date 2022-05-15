import type {
  AdminEntity,
  AdminSchema,
  BoundingBox,
  Location,
  PublishedEntity,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { isLocationItemField, visitItemRecursively } from '@jonasb/datadata-core';
import type { Dispatch, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { SearchEntityStateActions } from '../..';
import type { SearchEntityState, SearchEntityStateAction } from '../../..';
import { MapContainer } from '../../..';

export interface EntityMapProps<TEntity> {
  className?: string;
  schema: AdminSchema | PublishedSchema | undefined;
  center?: Location | null;
  resetSignal?: unknown;
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  filterEntity?: (entity: TEntity) => boolean;
  renderEntityMarker: (key: string, entity: TEntity, location: Location) => JSX.Element;
  children?: ReactNode;
}

export function EntityMap<TEntity extends AdminEntity | PublishedEntity>({
  className,
  schema,
  center,
  resetSignal,
  searchEntityState,
  dispatchSearchEntityState,
  filterEntity,
  renderEntityMarker,
  children,
}: EntityMapProps<TEntity>): JSX.Element | null {
  const { entities } = searchEntityState;

  const handleBoundingBoxChange = useCallback(
    (boundingBox: BoundingBox): void =>
      dispatchSearchEntityState(
        new SearchEntityStateActions.SetQuery(
          { boundingBox },
          { partial: true, resetPagingIfModifying: true }
        )
      ),
    [dispatchSearchEntityState]
  );

  return (
    <MapContainer
      className={className}
      center={center}
      resetSignal={resetSignal}
      onBoundingBoxChanged={handleBoundingBoxChange}
    >
      {schema
        ? entities.map((entityResult) => {
            if (entityResult.isError()) {
              return null;
            }
            const entity = entityResult.value as TEntity;
            if (filterEntity && !filterEntity(entity)) {
              return null;
            }
            const locations = extractEntityLocations(schema, entity);
            return locations.map((location, locationIndex) =>
              renderEntityMarker(`${entity.id}-${locationIndex}`, entity as TEntity, location)
            );
          })
        : null}
      {children}
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
