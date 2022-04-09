import { ButtonDropdown } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../..';
import { SearchEntityStateActions } from '../..';

interface Item {
  id: string;
  count: number;
}

const items = [
  { id: '25', count: 25 },
  { id: '50', count: 50 },
  { id: '75', count: 75 },
  { id: '100', count: 100 },
];

export function SampleEntitiesOptionsCount({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const { requestedCount } = searchEntityState;
  const handleCountChange = useCallback(
    (item: Item) => {
      dispatchSearchEntityState(
        new SearchEntityStateActions.SetSampling({ count: item.count }, true)
      );
    },
    [dispatchSearchEntityState]
  );

  const currentPage =
    searchEntityState.entitySamples && searchEntityState.entitySamples.items.length > 0
      ? `${searchEntityState.entitySamples.items.length} of ${searchEntityState.entitySamples.totalCount}`
      : requestedCount;

  return (
    <ButtonDropdown
      up
      sneaky
      activeItemId={String(requestedCount)}
      items={items}
      renderItem={(item) => item.count}
      onItemClick={handleCountChange}
    >
      {currentPage}
    </ButtonDropdown>
  );
}
