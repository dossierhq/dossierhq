import type { AdminEntity, AdminQuery } from '@datadata/core';
import React, { useCallback, useState } from 'react';
import { Button } from '../../generic-components/Button/Button';
import { EntityList } from '../EntityList/EntityList';
import { EntityMap } from '../EntityMap/EntityMap';

export interface EntitySearchProps {
  query?: AdminQuery;
  style?: React.CSSProperties;
  onEntityClick: (entity: AdminEntity) => void;
}

export function EntitySearch({ query, style, onEntityClick }: EntitySearchProps): JSX.Element {
  const [showList, setShowList] = useState(true);
  const toggleShowList = useCallback(() => setShowList((x) => !x), [setShowList]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <Button onClick={toggleShowList}>Toggle list/map</Button>
      {showList ? (
        <EntityList query={query} onEntityClick={onEntityClick} style={{ flexGrow: 1 }} />
      ) : (
        <EntityMap query={query} onEntityClick={onEntityClick} style={{ flexGrow: 1 }} />
      )}
    </div>
  );
}
