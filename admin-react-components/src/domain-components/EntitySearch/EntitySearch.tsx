import type { AdminEntity, AdminQuery } from '@datadata/core';
import React, { useCallback, useState } from 'react';
import { Button, Column, ColumnItem, EntityList, EntityMap } from '../..';

export interface EntitySearchProps {
  className?: string;
  query?: AdminQuery;
  onEntityClick: (entity: AdminEntity) => void;
}

export function EntitySearch({ className, query, onEntityClick }: EntitySearchProps): JSX.Element {
  const [showList, setShowList] = useState(true);
  const toggleShowList = useCallback(() => setShowList((x) => !x), [setShowList]);
  return (
    <Column className={className}>
      <Button onClick={toggleShowList}>Toggle list/map</Button>
      {showList ? (
        <ColumnItem as={EntityList} grow query={query} onEntityClick={onEntityClick} />
      ) : (
        <ColumnItem as={EntityMap} grow query={query} onEntityClick={onEntityClick} />
      )}
    </Column>
  );
}
