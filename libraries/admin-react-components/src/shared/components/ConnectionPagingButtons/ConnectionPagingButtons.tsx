import type { Connection, Edge, ErrorType, Paging } from '@jonasb/datadata-core';
import { IconButton } from '@jonasb/datadata-design';
import React, { useMemo } from 'react';

interface Props {
  connection: Connection<Edge<unknown, ErrorType>> | null | undefined;
  pagingCount: number;
  onPagingChange: (paging: Paging) => void;
}

export function ConnectionPagingButtons({ connection, pagingCount, onPagingChange }: Props) {
  const handleStart = useMemo(() => {
    return connection?.pageInfo.hasPreviousPage
      ? () => onPagingChange({ first: pagingCount })
      : undefined;
  }, [connection?.pageInfo.hasPreviousPage, onPagingChange, pagingCount]);

  const handlePrevious = useMemo(() => {
    return connection?.pageInfo.hasPreviousPage
      ? () =>
          onPagingChange({
            last: pagingCount,
            before: connection.pageInfo.startCursor,
          })
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
          onPagingChange({
            first: pagingCount,
            after: connection.pageInfo.endCursor,
          })
      : undefined;
  }, [
    connection?.pageInfo.endCursor,
    connection?.pageInfo.hasNextPage,
    onPagingChange,
    pagingCount,
  ]);

  const handleEnd = useMemo(() => {
    return connection?.pageInfo.hasNextPage
      ? () => onPagingChange({ last: pagingCount })
      : undefined;
  }, [connection?.pageInfo.hasNextPage, onPagingChange, pagingCount]);

  return (
    <IconButton.Group condensed skipBottomMargin>
      <IconButton icon="first" disabled={!handleStart} onClick={handleStart} />
      <IconButton icon="previous" disabled={!handlePrevious} onClick={handlePrevious} />
      <IconButton icon="next" disabled={!handleNext} onClick={handleNext} />
      <IconButton icon="last" disabled={!handleEnd} onClick={handleEnd} />
    </IconButton.Group>
  );
}
