import type { AdminEntity, AdminQuery } from '@datadata/core';
import React, { useContext } from 'react';
import type { DataDataContextValue } from '../..';
import { Button, DataDataContext, Message } from '../..';

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
  const { connection, connectionError } = useSearchEntities(query ?? {});

  return (
    <div className="dd list-container">
      {connection &&
        connection.edges.map((edge) => {
          if (edge.node.isOk()) {
            const entity = edge.node.value;
            return (
              <Button key={edge.cursor} onClick={() => onEntityClick(entity)}>
                {`${entity._type}: ${entity._name}`}
              </Button>
            );
          }
          return (
            <Message
              key={edge.cursor}
              kind="danger"
              message={`${edge.node.error}: ${edge.node.message}`}
            />
          );
        })}
    </div>
  );
}
