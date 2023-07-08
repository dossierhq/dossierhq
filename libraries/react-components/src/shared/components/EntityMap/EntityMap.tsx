import type {
  AdminEntity,
  AdminSchema,
  BoundingBox,
  Location,
  PublishedEntity,
  PublishedSchema,
} from '@dossierhq/core';
import { isLocationItemField, ItemTraverseNodeType, traverseEntity } from '@dossierhq/core';
import { MapContainer } from '@dossierhq/leaflet';
import type { Dispatch, ReactNode } from 'react';
import { useCallback } from 'react';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';

//TODO make configurable through a context. also max bounds
const defaultCenter = { lat: 55.60498, lng: 13.003822 } as const;

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
          { partial: true, resetPagingIfModifying: true },
        ),
      ),
    [dispatchSearchEntityState],
  );

  return (
    <MapContainer
      className={className}
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
  schema: AdminSchema | PublishedSchema,
  entity: AdminEntity | PublishedEntity,
) {
  const locations: Location[] = [];
  for (const node of traverseEntity(schema, ['entity'], entity)) {
    if (node.type === ItemTraverseNodeType.fieldItem) {
      if (isLocationItemField(node.fieldSpec, node.value) && node.value) {
        locations.push(node.value);
      }
    }
  }
  return locations;
}
