import type { AdminEntity, AdminQuery } from '@datadata/core';
import React, { useContext } from 'react';
import type { DataDataContextValue } from '../..';
import { DataDataContext } from '../..';

export interface EntityListProps {
  query?: AdminQuery;
  onEntityClick: (entity: AdminEntity) => void;
}

interface InnerProps extends EntityListProps {
  useSearchEntities: DataDataContextValue['useSearchEntities'];
}

export function EntityList({ query, onEntityClick }: EntityListProps): JSX.Element | null {
  const context = useContext(DataDataContext);
  if (!context) {
    return null;
  }
  const { useSearchEntities } = context;
  return <EntityListInner {...{ query, useSearchEntities, onEntityClick }} />;
}

function EntityListInner({ query, useSearchEntities, onEntityClick }: InnerProps) {
  const { connection, connectionError } = useSearchEntities(query);

  return (
    <div>
      {connection &&
        connection.edges.map((edge) => {
          const entity = edge.node.isOk() ? edge.node.value : null;
          return (
            <p
              key={edge.cursor}
              onClick={() => {
                if (entity) onEntityClick(entity);
              }}
            >
              {edge.node.isOk() ? edge.node.value._name : edge.node.error}
            </p>
          );
        })}
    </div>
  );
}
