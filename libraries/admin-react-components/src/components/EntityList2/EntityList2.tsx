import type { AdminEntity } from '@jonasb/datadata-core';
import { AdminQueryOrder } from '@jonasb/datadata-core';
import { InstantDisplay, Table } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../index.js';
import { SearchEntityStateActions, StatusTag } from '../../index.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: AdminEntity) => void;
}

export function EntityList2({ searchEntityState, dispatchSearchEntityState, onItemClick }: Props) {
  const {
    connection,
    query: { order },
  } = searchEntityState;
  return (
    <Table>
      <Table.Head>
        <Table.Row sticky>
          <Table.Header
            order={order === AdminQueryOrder.name ? 'asc' : ''}
            onClick={() =>
              dispatchSearchEntityState(
                new SearchEntityStateActions.SetQuery({ order: AdminQueryOrder.name }, true)
              )
            }
          >
            Name
          </Table.Header>
          <Table.Header>Entity type</Table.Header>
          <Table.Header narrow>Status</Table.Header>
          <Table.Header
            narrow
            order={order === AdminQueryOrder.createdAt ? 'asc' : ''}
            onClick={() =>
              dispatchSearchEntityState(
                new SearchEntityStateActions.SetQuery({ order: AdminQueryOrder.createdAt }, true)
              )
            }
          >
            Created
          </Table.Header>
          <Table.Header
            narrow
            order={order === AdminQueryOrder.updatedAt ? 'asc' : ''}
            onClick={() =>
              dispatchSearchEntityState(
                new SearchEntityStateActions.SetQuery({ order: AdminQueryOrder.updatedAt }, true)
              )
            }
          >
            Updated
          </Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {connection?.edges.map((edge) => {
          if (edge.node.isOk()) {
            const entity = edge.node.value as AdminEntity;
            return (
              <Table.Row key={entity.id} clickable onClick={() => onItemClick(entity)}>
                <Table.Cell>{entity.info.name}</Table.Cell>
                <Table.Cell>{entity.info.type}</Table.Cell>
                <Table.Cell narrow>
                  <StatusTag status={entity.info.publishingState} />
                </Table.Cell>
                <Table.Cell narrow>
                  <InstantDisplay instant={entity.info.createdAt} />
                </Table.Cell>
                <Table.Cell narrow>
                  {order === AdminQueryOrder.updatedAt ||
                  !entity.info.updatedAt.equals(entity.info.createdAt) ? (
                    <InstantDisplay instant={entity.info.updatedAt} />
                  ) : null}
                </Table.Cell>
              </Table.Row>
            );
          }
        })}
      </Table.Body>
    </Table>
  );
}
