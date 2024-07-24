'use client';

import {
  ContentTraverseNodeType,
  isLocationItemField,
  traverseEntity,
  type BoundingBox,
  type Entity,
  type Location,
  type PublishedEntity,
  type PublishedSchema,
  type Schema,
} from '@dossierhq/core';
import { MapContainer } from '@dossierhq/leaflet';
import { useCallback, type Dispatch, type ReactNode } from 'react';
import { cn } from '../lib/utils.js';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';

//TODO make configurable through a context. also max bounds
const defaultCenter = { lat: 55.60498, lng: 13.003822 } as const;

export interface ContentMapProps<TEntity = Entity> {
  className?: string;
  schema: Schema | PublishedSchema | undefined;
  center?: Location | null;
  resetSignal?: unknown;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  filterEntity?: (entity: TEntity) => boolean;
  renderEntityMarker: (key: string, entity: TEntity, location: Location) => JSX.Element;
  children?: ReactNode;
}

export function ContentMap<TEntity extends Entity | PublishedEntity = Entity>({
  className,
  schema,
  center,
  resetSignal,
  contentListState,
  dispatchContentList,
  filterEntity,
  renderEntityMarker,
  children,
}: ContentMapProps<TEntity>): JSX.Element | null {
  const { entities } = contentListState;

  const handleBoundingBoxChange = useCallback(
    (boundingBox: BoundingBox): void =>
      dispatchContentList(
        new ContentListStateActions.SetQuery(
          { boundingBox },
          { partial: true, resetPagingIfModifying: true },
        ),
      ),
    [dispatchContentList],
  );

  return (
    <MapContainer
      className={cn(className, 'chromatic-ignore')}
      center={center ?? defaultCenter}
      resetSignal={resetSignal}
      onBoundingBoxChanged={handleBoundingBoxChange}
    >
      <MapContainer.LocateControl />
      {schema && entities
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
              renderEntityMarker(`${entity.id}-${locationIndex}`, entity as TEntity, location),
            );
          })
        : null}
      {children}
    </MapContainer>
  );
}

function extractEntityLocations(
  schema: Schema | PublishedSchema,
  entity: Entity | PublishedEntity,
) {
  const locations: Location[] = [];
  for (const node of traverseEntity(schema, ['entity'], entity)) {
    if (node.type === ContentTraverseNodeType.fieldItem) {
      if (isLocationItemField(node.fieldSpec, node.value) && node.value) {
        locations.push(node.value);
      }
    }
  }
  return locations;
}
