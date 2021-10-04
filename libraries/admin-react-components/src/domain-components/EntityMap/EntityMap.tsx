import type { AdminEntity, AdminQuery, BoundingBox, Location, Schema } from '@jonasb/datadata-core';
import { isLocationItemField, visitItemRecursively } from '@jonasb/datadata-core';
import React, { useContext, useEffect, useState } from 'react';
import { DataDataContext, MapContainer, PublishStateTag } from '../../index.js';

export interface EntityMapProps {
  className?: string;
  query?: AdminQuery;
  onEntityClick: (entity: AdminEntity) => void;
}

export function EntityMap({ className, query, onEntityClick }: EntityMapProps): JSX.Element | null {
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
    <MapContainer className={className} center={null} onBoundingBoxChanged={setBoundingBox}>
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
                onClick={() => onEntityClick(entity)}
              />
            );
          })
        : null}
    </MapContainer>
  );
}

function EntityMarker({
  schema,
  entity,
  onClick,
}: {
  schema: Schema;
  entity: AdminEntity;
  onClick: () => void;
}) {
  const entityLocations: { location: Location }[] = [];
  visitItemRecursively({
    schema,
    item: entity,
    visitField: (_path, fieldSpec, data, _visitContext) => {
      if (isLocationItemField(fieldSpec, data) && data) {
        entityLocations.push({ location: data });
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
