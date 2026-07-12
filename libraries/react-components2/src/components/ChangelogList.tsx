import { EventType, type ChangelogEvent } from '@dossierhq/core';
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from 'lucide-react';
import type { Dispatch } from 'react';
import {
  ChangelogStateActions,
  type ChangelogState,
  type ChangelogStateAction,
} from '../reducers/ChangelogReducer.js';
import { DateDisplay } from './DateDisplay.js';
import { EmptyStateMessage } from './EmptyStateMessage.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.js';

interface Props {
  className?: string;
  changelogState: ChangelogState;
  dispatchChangelog: Dispatch<ChangelogStateAction>;
}

export function ChangelogList({ className, changelogState, dispatchChangelog }: Props) {
  const {
    edges,
    query: { reverse },
  } = changelogState;

  const isEmpty = edges?.length === 0;

  if (isEmpty) {
    return (
      <div className={className}>
        <div className="flex h-full flex-col items-center justify-center">
          <EmptyStateMessage
            className="w-full max-w-96"
            icon={<SearchIcon />}
            title="No events"
            description="No actions have been performed"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead className="w-full">Details</TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1"
                onClick={() =>
                  dispatchChangelog(
                    new ChangelogStateActions.SetQuery(
                      { reverse: !reverse },
                      { partial: true, resetPagingIfModifying: true },
                    ),
                  )
                }
              >
                Created at
                {reverse ? (
                  <ArrowDownIcon className="size-4" />
                ) : (
                  <ArrowUpIcon className="size-4" />
                )}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {edges?.map((edge) => {
            if (!edge.node.isOk()) {
              return null;
            }
            const event = edge.node.value;
            return <ChangelogListRow key={edge.cursor} event={event} />;
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ChangelogListRow({ event }: { event: ChangelogEvent }) {
  let details;
  switch (event.type) {
    case EventType.createPrincipal:
      details = null;
      break;
    case EventType.updateSchema:
      details = `Version ${event.version}`;
      break;
    default: {
      details = (
        <>
          {event.entities
            .map((entity) => `${entity.name} (${entity.type}) version ${entity.version}`)
            .join(', ')}
          {event.unauthorizedEntityCount > 0 ? (
            <i>{event.unauthorizedEntityCount} other entities</i>
          ) : null}
        </>
      );
      break;
    }
  }

  return (
    <TableRow>
      <TableCell>{event.type}</TableCell>
      <TableCell className="whitespace-normal">{details}</TableCell>
      <TableCell>
        <DateDisplay date={event.createdAt} />
      </TableCell>
    </TableRow>
  );
}
