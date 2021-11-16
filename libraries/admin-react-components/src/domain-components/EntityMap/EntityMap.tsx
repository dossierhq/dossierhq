import type {
  AdminEntity,
  AdminQuery,
  AdminSchema,
  BoundingBox,
  ItemValuePath,
  Location,
} from '@jonasb/datadata-core';
import { isLocationItemField, visitItemRecursively } from '@jonasb/datadata-core';
import type { ReactNode } from 'react';
import React, { useContext, useEffect, useState } from 'react';
import { DataDataContext, MapContainer, PublishStateTag } from '../../index.js';

export interface EntityMapProps {
  className?: string;
  center?: Location | null;
  zoom?: number | null;
  query?: AdminQuery;
  filterEntityLocations?: (entity: AdminEntity, valuePath: ItemValuePath) => boolean;
  onEntityClick: (entity: AdminEntity) => void;
  children?: ReactNode;
}

export function EntityMap({
  className,
  center,
  zoom,
  query,
  filterEntityLocations,
  onEntityClick,
  children,
}: EntityMapProps): JSX.Element | null {
  const { schema, useSearchEntities } = useContext(DataDataContext);
  const [currentQuery, setCurrentQuery] = useState<AdminQuery | undefined>(undefined);
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  //TODO handle error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { connection, connectionError } = useSearchEntities(currentQuery);

  useEffect(() => {
    if (boundingBox) {
      setCurrentQuery({ ...query, boundingBox });
    }
  }, [query, boundingBox]);

  return (
    <MapContainer
      className={className}
      center={center}
      zoom={zoom}
      onBoundingBoxChanged={setBoundingBox}
    >
      {connection
        ? connection.edges.map((edge) => {
            if (edge.node.isError()) {
              return null;
            }
            const entity = edge.node.value;
            return (
              <EntityMarker
                key={entity.id}
                schema={schema}
                entity={entity}
                filterEntityLocations={filterEntityLocations}
                onClick={() => onEntityClick(entity)}
              />
            );
          })
        : null}
      {children}
    </MapContainer>
  );
}

function EntityMarker({
  schema,
  entity,
  filterEntityLocations,
  onClick,
}: {
  schema: AdminSchema;
  entity: AdminEntity;
  filterEntityLocations?: (entity: AdminEntity, valuePath: ItemValuePath) => boolean;
  onClick: () => void;
}) {
  const entityLocations: { location: Location }[] = [];
  visitItemRecursively({
    schema,
    item: entity,
    visitField: (path, fieldSpec, data, _visitContext) => {
      if (isLocationItemField(fieldSpec, data) && data) {
        if (filterEntityLocations?.(entity, path) !== false) {
          entityLocations.push({ location: data });
        }
      }
    },
    visitRichTextBlock: (_path, _fieldSpec, _block, _visitContext) => {
      //empty
    },
    initialVisitContext: undefined,
  });

  return (
    <>
      {entityLocations.map((item, index) => (
        <MapContainer.Marker
          key={index}
          location={item.location}
          tooltip={
            <>
              {`${entity.info.type}: ${entity.info.name}`}
              <PublishStateTag publishState={entity.info.publishingState} />
            </>
          }
          onClick={onClick}
        />
      ))}
    </>
  );
}
