import {
  getPagingInfo,
  type Connection,
  type Edge,
  type ErrorType,
  type Paging,
} from '@dossierhq/core';
import { useState } from 'react';
import { numberWithThousandsSeparator } from '../utils/NumberDisplayUtils.js';
import { Button } from './ui/button.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';

interface Props {
  connection: Connection<Edge<unknown, ErrorType>> | null | undefined;
  paging: Paging | undefined;
  pagingCount: number;
  totalCount: number | null;
  onPagingChange: (paging: Paging) => void;
}

const items = [
  { id: '25', count: 25 },
  { id: '50', count: 50 },
  { id: '75', count: 75 },
  { id: '100', count: 100 },
];

export function ConnectionPagingCount({
  connection,
  paging,
  pagingCount,
  totalCount,
  onPagingChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const currentPage =
    connection?.edges.length && totalCount !== null
      ? `${connection.edges.length} of ${numberWithThousandsSeparator(totalCount)}`
      : pagingCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost">{currentPage}</Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-[200px] flex-col gap-2 p-1">
        <p className="p-2 text-center text-sm font-semibold">Items per page</p>
        {items.map((it) => (
          <Button
            key={it.id}
            variant={it.count === pagingCount ? 'default' : 'ghost'}
            onClick={() => {
              const pagingInfo = getPagingInfo(paging);
              const newPaging = { ...paging };
              if (pagingInfo.isOk() && !pagingInfo.value.forwards) {
                newPaging.last = it.count;
              } else {
                newPaging.first = it.count;
              }
              onPagingChange(newPaging);
              setOpen(false);
            }}
          >
            {it.count}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
