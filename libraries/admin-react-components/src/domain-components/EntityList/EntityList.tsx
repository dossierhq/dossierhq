import type { AdminEntity, AdminQuery, Paging } from '@jonasb/datadata-core';
import React, { useContext, useMemo, useState } from 'react';
import { Button, DataDataContext, Message, PublishStateTag, Row } from '../..';
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
  const [paging, setPaging] = useState<Paging>({});
  const { connection, connectionError } = useSearchEntities(query ?? {}, paging);

  const handleStart = useMemo(() => {
    return paging.after || paging.before ? () => setPaging({}) : undefined;
  }, [paging, setPaging]);

  const handlePrevious = useMemo(() => {
    return connection?.pageInfo.hasPreviousPage
      ? () => setPaging({ before: connection.pageInfo.startCursor })
      : undefined;
  }, [connection, setPaging]);

  const handleNext = useMemo(() => {
    return connection?.pageInfo.hasNextPage
      ? () => setPaging({ after: connection.pageInfo.endCursor })
      : undefined;
  }, [connection, setPaging]);

  return (
    <div className={joinClassNames('dd list-container', className)}>
      {connection &&
        connection.edges.map((edge) => {
          if (edge.node.isOk()) {
            const entity = edge.node.value;
            return (
              <Button key={edge.cursor} onClick={() => onEntityClick(entity)}>
                {`${entity.info.type}: ${entity.info.name}`}
                <PublishStateTag publishState={entity.info.publishingState} />
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
      <Row>
        <Button onClick={handleStart} disabled={!handleStart}>
          Start
        </Button>
        <Button onClick={handlePrevious} disabled={!handlePrevious}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!handleNext}>
          Next
        </Button>
      </Row>
    </div>
  );
}
