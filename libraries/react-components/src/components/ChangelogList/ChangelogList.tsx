import { EventType, type ChangelogEvent } from '@dossierhq/core';
import { DateDisplay, EmptyStateMessage, Table, toSizeClassName } from '@dossierhq/design';
import type { Dispatch } from 'react';
import {
  ChangelogStateActions,
  type ChangelogState,
  type ChangelogStateAction,
} from '../../reducers/ChangelogReducer/ChangelogReducer.js';

interface Props {
  changelogState: ChangelogState;
  dispatchChangelogState: Dispatch<ChangelogStateAction>;
}

export function ChangelogList({ changelogState, dispatchChangelogState }: Props) {
  const {
    edges,
    query: { reverse },
  } = changelogState;

  const direction = reverse ? 'desc' : 'asc';
  const isEmpty = edges?.length === 0;

  return (
    <Table
      className={isEmpty ? toSizeClassName({ height: '100%' }) : undefined}
      hoverable={!isEmpty}
    >
      <Table.Head>
        <Table.Row sticky>
          <Table.Header narrow>Event</Table.Header>
          <Table.Header>Details</Table.Header>
          <Table.Header
            narrow
            order={direction}
            onClick={() => handleHeaderClick(dispatchChangelogState, reverse)}
          >
            Created at
          </Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {isEmpty ? (
          <Table.Row>
            <Table.Cell className={toSizeClassName({ height: '100%' })} colSpan={3}>
              <EmptyStateMessage
                icon="search"
                title="No events"
                message="No actions have been performed"
              />
            </Table.Cell>
          </Table.Row>
        ) : (
          edges?.map((edge) => {
            if (edge.node.isOk()) {
              const event = edge.node.value;
              return <ChangelogListRow key={edge.cursor} {...{ event }} />;
            }
          })
        )}
      </Table.Body>
    </Table>
  );
}

function ChangelogListRow({ event }: { event: ChangelogEvent }) {
  let details;
  switch (event.type) {
    case EventType.updateSchema:
      details = `Version ${event.version}`;
      break;
    default:
      details = event.entities
        .map((entity) => `${entity.name} (${entity.type}) version ${entity.version}`)
        .join(', ');
      break;
  }

  return (
    <Table.Row>
      <Table.Cell>{event.type}</Table.Cell>
      <Table.Cell>{details}</Table.Cell>
      <Table.Cell>
        <DateDisplay date={event.createdAt} />
      </Table.Cell>
    </Table.Row>
  );
}

function handleHeaderClick(
  dispatchSearchEntityState: Dispatch<ChangelogStateAction>,
  reverse: boolean | undefined,
) {
  const newReverse = !reverse;
  dispatchSearchEntityState(
    new ChangelogStateActions.SetQuery(
      { reverse: newReverse },
      { partial: true, resetPagingIfModifying: true },
    ),
  );
}
