import type { AdminEntity, AdminSearchQuery } from '@jonasb/datadata-core';
import { Column, Row, Button } from '@jonasb/datadata-design';
import React, { useCallback, useReducer, useState } from 'react';
import { ColumnItem } from '../../generic-components/Column/Column';
import { InputText } from '../../generic-components/InputText/InputText';
import { RowItem } from '../../generic-components/Row/Row';
import { LegacyEntityList } from '../LegacyEntityList/LegacyEntityList';
import { LegacyEntityMap } from '../LegacyEntityMap/LegacyEntityMap';
import {
  initializeAdminQueryState,
  reduceAdminQueryState,
  SetAdminQueryTextAction,
} from './LegacyAdminQueryReducer';

export interface LegacyEntitySearchProps {
  className?: string;
  query?: AdminSearchQuery;
  onEntityClick: (entity: AdminEntity) => void;
}

export function LegacyEntitySearch({
  className,
  query,
  onEntityClick,
}: LegacyEntitySearchProps): JSX.Element {
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
          as={LegacyEntityList}
          overflowY="scroll"
          grow
          query={resolvedQuery}
          onEntityClick={onEntityClick}
        />
      ) : (
        <ColumnItem as={LegacyEntityMap} grow query={resolvedQuery} onEntityClick={onEntityClick} />
      )}
    </Column>
  );
}
