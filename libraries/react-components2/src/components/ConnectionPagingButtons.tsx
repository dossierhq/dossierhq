import type { Connection, Edge, ErrorType, Paging } from '@dossierhq/core';
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from './ui/button.js';

interface Props {
  connection: Connection<Edge<unknown, ErrorType>> | null | undefined;
  pagingCount: number;
  onPagingChange: (
    paging: Paging,
    pagingAction: 'first-page' | 'prev-page' | 'next-page' | 'last-page',
  ) => void;
}

export function ConnectionPagingButtons({ connection, pagingCount, onPagingChange }: Props) {
  const handleStart = useMemo(() => {
    return connection?.pageInfo.hasPreviousPage
      ? () => onPagingChange({ first: pagingCount }, 'first-page')
      : undefined;
  }, [connection?.pageInfo.hasPreviousPage, onPagingChange, pagingCount]);

  const handlePrevious = useMemo(() => {
    return connection?.pageInfo.hasPreviousPage
      ? () =>
          onPagingChange(
            { last: pagingCount, before: connection.pageInfo.startCursor },
            'prev-page',
          )
      : undefined;
  }, [
    connection?.pageInfo.hasPreviousPage,
    connection?.pageInfo.startCursor,
    onPagingChange,
    pagingCount,
  ]);

  const handleNext = useMemo(() => {
    return connection?.pageInfo.hasNextPage
      ? () =>
          onPagingChange({ first: pagingCount, after: connection.pageInfo.endCursor }, 'next-page')
      : undefined;
  }, [
    connection?.pageInfo.endCursor,
    connection?.pageInfo.hasNextPage,
    onPagingChange,
    pagingCount,
  ]);

  const handleEnd = useMemo(() => {
    return connection?.pageInfo.hasNextPage
      ? () => onPagingChange({ last: pagingCount }, 'last-page')
      : undefined;
  }, [connection?.pageInfo.hasNextPage, onPagingChange, pagingCount]);

  return (
    <>
      <Button disabled={!handleStart} variant="outline" size="icon" onMouseDown={handleStart}>
        <ChevronFirstIcon className="h-4 w-4" />
      </Button>
      <Button disabled={!handlePrevious} variant="outline" size="icon" onMouseDown={handlePrevious}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Button disabled={!handleNext} variant="outline" size="icon" onMouseDown={handleNext}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
      <Button disabled={!handleEnd} variant="outline" size="icon" onMouseDown={handleEnd}>
        <ChevronLastIcon className="h-4 w-4" />
      </Button>
    </>
  );
}
