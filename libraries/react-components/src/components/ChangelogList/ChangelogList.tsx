import type { ChangelogEvent, EntityReference } from '@dossierhq/core';
import { EmptyStateMessage, Table, toSizeClassName } from '@dossierhq/design';
import type { Dispatch } from 'react';
import {
  ChangelogStateActions,
  type ChangelogState,
  type ChangelogStateAction,
} from '../../reducers/ChangelogReducer/ChangelogReducer.js';

interface Props {
  changelogState: ChangelogState;
  dispatchChangelogState: Dispatch<ChangelogStateAction>;
  onItemClick: (item: EntityReference) => void;
}

export function ChangelogList({ changelogState, dispatchChangelogState, onItemClick }: Props) {
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
          <Table.Header>Event</Table.Header>
          <Table.Header>Created by</Table.Header>
          <Table.Header
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
              return <ChangelogListRow key={edge.cursor} {...{ event, onItemClick }} />;
            }
          })
        )}
      </Table.Body>
    </Table>
  );
}

function ChangelogListRow({
  event,
  onItemClick,
}: {
  event: ChangelogEvent;
  onItemClick: (item: EntityReference) => void;
}) {
  return (
    <Table.Row>
      <Table.Cell>{event.type}</Table.Cell>
      <Table.Cell>{event.createdBy}</Table.Cell>
      <Table.Cell>{event.createdAt.toISOString()}</Table.Cell>
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
