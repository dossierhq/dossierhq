import type { AdminEntity, Entity, Location, Schema } from '@jonasb/datadata-core';
import { isLocationItemField, visitItemRecursively } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import React, { useContext } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../../index.js';
import { DataDataContext2, MapContainer, StatusTag } from '../../../index.js';
import { SearchEntityStateActions } from '../../index.js';

export interface EntityMapProps {
  className?: string;
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (entity: AdminEntity | Entity) => void;
}

export function EntityMap2({
  className,
  searchEntityState,
  dispatchSearchEntityState,
  onItemClick,
}: EntityMapProps): JSX.Element | null {
  const { schema } = useContext(DataDataContext2);
  const { connection } = searchEntityState;

  return (
    <MapContainer
      className={className}
      center={null}
      onBoundingBoxChanged={(boundingBox) =>
        dispatchSearchEntityState(new SearchEntityStateActions.SetQuery({ boundingBox }, true))
      }
    >
      {connection && schema
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
                onClick={() => onItemClick(entity)}
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
  entity: AdminEntity | Entity;
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
              {'publishingState' in entity.info ? (
                <>
                  {' '}
                  <StatusTag status={entity.info.publishingState} />
                </>
              ) : null}
            </>
          }
          onClick={onClick}
        />
      ))}
    </>
  );
}
