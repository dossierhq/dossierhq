import type { Entity } from '@jonasb/datadata-core';
import { QueryOrder } from '@jonasb/datadata-core';
import { Table } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../index.js';
import { SearchEntityStateActions } from '../../index.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: Entity) => void;
}

export function EntityList({ searchEntityState, dispatchSearchEntityState, onItemClick }: Props) {
  const {
    connection,
    query: { order },
  } = searchEntityState;
  return (
    <Table>
      <Table.Head>
        <Table.Row sticky>
          <Table.Header
            order={order === QueryOrder.name ? 'asc' : ''}
            onClick={() =>
              dispatchSearchEntityState(
                new SearchEntityStateActions.SetQuery({ order: QueryOrder.name }, true)
              )
            }
          >
            Name
          </Table.Header>
          <Table.Header>Entity type</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {connection?.edges.map((edge) => {
          if (edge.node.isOk()) {
            const entity = edge.node.value;
            return (
              <Table.Row key={entity.id} clickable onClick={() => onItemClick(entity)}>
                <Table.Cell>{entity.info.name}</Table.Cell>
                <Table.Cell>{entity.info.type}</Table.Cell>
              </Table.Row>
            );
          }
        })}
      </Table.Body>
    </Table>
  );
}
