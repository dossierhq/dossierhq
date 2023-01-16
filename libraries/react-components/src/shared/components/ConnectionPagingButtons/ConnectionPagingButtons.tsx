import type { Connection, Edge, ErrorType, Paging } from '@dossierhq/core';
import { IconButton } from '@dossierhq/design';
import React, { useMemo } from 'react';

interface Props {
  connection: Connection<Edge<unknown, ErrorType>> | null | undefined;
  pagingCount: number;
  onPagingChange: (
    paging: Paging,
    pagingAction: 'first-page' | 'prev-page' | 'next-page' | 'last-page'
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
            {
              last: pagingCount,
              before: connection.pageInfo.startCursor,
            },
            'prev-page'
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
          onPagingChange(
            {
              first: pagingCount,
              after: connection.pageInfo.endCursor,
            },
            'next-page'
          )
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
    <IconButton.Group condensed skipBottomMargin>
      <IconButton icon="first" disabled={!handleStart} onMouseDown={handleStart} />
      <IconButton icon="previous" disabled={!handlePrevious} onMouseDown={handlePrevious} />
      <IconButton icon="next" disabled={!handleNext} onMouseDown={handleNext} />
      <IconButton icon="last" disabled={!handleEnd} onMouseDown={handleEnd} />
    </IconButton.Group>
  );
}
