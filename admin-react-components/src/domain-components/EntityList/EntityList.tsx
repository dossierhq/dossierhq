import type { AdminEntity, AdminQuery } from '@datadata/core';
import { toAdminEntity1 } from '@datadata/core';
import React, { useContext } from 'react';
import { Button, DataDataContext, Message, PublishStateTag } from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';

export interface EntityListProps {
  className?: string;
  query?: AdminQuery;
  onEntityClick: (entity: AdminEntity) => void;
}

export function EntityList({
  className,
  query,
  onEntityClick,
}: EntityListProps): JSX.Element | null {
  const { useSearchEntities } = useContext(DataDataContext);
  const { connection, connectionError } = useSearchEntities(query ?? {});

  return (
    <div className={joinClassNames('dd list-container', className)}>
      {connection &&
        connection.edges.map((edge) => {
          if (edge.node.isOk()) {
            const entity = toAdminEntity1(edge.node.value);
            return (
              <Button key={edge.cursor} onClick={() => onEntityClick(entity)}>
                {`${entity._type}: ${entity._name}`}
                <PublishStateTag publishState={entity._publishState} />
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
