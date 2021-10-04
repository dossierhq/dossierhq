import type { AdminEntity, AdminQuery } from '@jonasb/datadata-core';
import React, { useCallback, useReducer, useState } from 'react';
import {
  Button,
  Column,
  ColumnItem,
  EntityList,
  EntityMap,
  InputText,
  Row,
  RowItem,
} from '../../index.js';
import {
  initializeAdminQueryState,
  reduceAdminQueryState,
  SetAdminQueryTextAction,
} from './AdminQueryReducer.js';

export interface EntitySearchProps {
  className?: string;
  query?: AdminQuery;
  onEntityClick: (entity: AdminEntity) => void;
}

export function EntitySearch({ className, query, onEntityClick }: EntitySearchProps): JSX.Element {
  const [{ resolvedQuery, text }, dispatchQuery] = useReducer(
    reduceAdminQueryState,
    query,
    initializeAdminQueryState
  );
  const [showList, setShowList] = useState(true);
  const toggleShowList = useCallback(() => setShowList((x) => !x), [setShowList]);
  const handleTextChange = useCallback(
    (value: string) => dispatchQuery(new SetAdminQueryTextAction(value)),
    [dispatchQuery]
  );

  return (
    <Column className={className}>
      <ColumnItem as={Row}>
        <RowItem as={InputText} grow value={text} onChange={handleTextChange} />
        <Button onClick={toggleShowList}>Toggle list/map</Button>
      </ColumnItem>
      {showList ? (
        <ColumnItem
          as={EntityList}
          overflowY="scroll"
          grow
          query={resolvedQuery}
          onEntityClick={onEntityClick}
        />
      ) : (
        <ColumnItem as={EntityMap} grow query={resolvedQuery} onEntityClick={onEntityClick} />
      )}
    </Column>
  );
}
