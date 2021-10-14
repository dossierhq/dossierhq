import type { Connection, Edge, ErrorType, Paging } from '@jonasb/datadata-core';
import { getPagingInfo } from '@jonasb/datadata-core';
import { Dropdown } from '@jonasb/datadata-design';
import React from 'react';

interface Props {
  connection: Connection<Edge<unknown, ErrorType>> | null | undefined;
  paging: Paging;
  pagingCount: number;
  totalCount: number | null;
  onPagingChange: (paging: Paging) => void;
}

export function ConnectionPagingCount({
  connection,
  paging,
  pagingCount,
  totalCount,
  onPagingChange,
}: Props) {
  const currentPage = `${connection?.edges.length ?? pagingCount} of ${totalCount}`;

  const items = [
    { id: '25', count: 25 },
    { id: '50', count: 50 },
    { id: '75', count: 75 },
    { id: '100', count: 100 },
  ];

  return (
    <Dropdown
      up
      sneaky
      activeItemId={String(pagingCount)}
      items={items}
      renderItem={(item) => item.count}
      onItemClick={({ count }) => {
        const pagingInfo = getPagingInfo(paging);
        const newPaging = { ...paging };
        if (pagingInfo.isOk() && !pagingInfo.value.forwards) {
          newPaging.last = count;
        } else {
          newPaging.first = count;
        }
        onPagingChange(newPaging);
      }}
    >
      {currentPage}
    </Dropdown>
  );
}
