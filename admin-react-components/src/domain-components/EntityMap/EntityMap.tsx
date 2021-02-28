import type { AdminEntity, AdminQuery, BoundingBox, Location, Schema } from '@datadata/core';
import { isLocationItemField, visitFieldsRecursively } from '@datadata/core';
import React, { useContext, useEffect, useState } from 'react';
import type { DataDataContextValue } from '../..';
import { DataDataContext, MapContainer } from '../..';

export interface EntityMapProps {
  query?: AdminQuery;
  onEntityClick: (entity: AdminEntity) => void;
  style?: React.CSSProperties;
}

interface InnerProps extends EntityMapProps {
  schema: Schema;
  useSearchEntities: DataDataContextValue['useSearchEntities'];
}

export function EntityMap({ query, style, onEntityClick }: EntityMapProps): JSX.Element | null {
  const context = useContext(DataDataContext);
  if (!context) {
    return null;
  }
  const { schema, useSearchEntities } = context;
  return <EntityMapInner {...{ query, style, schema, useSearchEntities, onEntityClick }} />;
}

function EntityMapInner({ query, style, schema, useSearchEntities, onEntityClick }: InnerProps) {
  const [currentQuery, setCurrentQuery] = useState<AdminQuery | undefined>(undefined);
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const { connection, connectionError } = useSearchEntities(currentQuery);

  useEffect(() => {
    if (boundingBox) {
      setCurrentQuery({ ...query, boundingBox });
    }
  }, [query, boundingBox]);

  return (
    <MapContainer center={null} style={style} onBoundingBoxChanged={setBoundingBox}>
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
  visitFieldsRecursively({
    schema,
    entity,
    visitField: (path, fieldSpec, data, unusedVisitContext) => {
      if (isLocationItemField(fieldSpec, data) && data) {
        entityLocations.push({ location: data });
      }
    },
    initialVisitContext: undefined,
  });

  return (
    <>
      {entityLocations.map((item, index) => (
        <MapContainer.Marker
          key={index}
          location={item.location}
          title={`${entity._type}: ${entity._name}`}
          onClick={onClick}
        />
      ))}
    </>
  );
}
