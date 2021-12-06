import type { AdminQueryOrder, Entity } from '@jonasb/datadata-core';
import { QueryOrder } from '@jonasb/datadata-core';
import { Table } from '@jonasb/datadata-design';
import { Dispatch, useContext } from 'react';
import React from 'react';
import {
  AuthKeyTag,
  PublishedDataDataContext,
  SearchEntityState,
  SearchEntityStateAction,
} from '../../index.js';
import { SearchEntityStateActions } from '../../index.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: Entity) => void;
}

export function EntityList({ searchEntityState, dispatchSearchEntityState, onItemClick }: Props) {
  const {
    connection,
    query: { order, reverse },
  } = searchEntityState;
  const { authKeys } = useContext(PublishedDataDataContext);
  const direction = reverse ? 'desc' : 'asc';
  return (
    <Table>
      <Table.Head>
        <Table.Row sticky>
          <Table.Header
            order={order === QueryOrder.name ? direction : ''}
            onClick={() =>
              handleHeaderClick(dispatchSearchEntityState, order, reverse, QueryOrder.name)
            }
          >
            Name
          </Table.Header>
          <Table.Header>Entity type</Table.Header>
          <Table.Header narrow>Auth key</Table.Header>
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
                <Table.Cell narrow>
                  <AuthKeyTag
                    authKey={entity.info.authKey}
                    displayName={
                      authKeys.find((it) => it.authKey === entity.info.authKey)?.displayName ?? null
                    }
                  />
                </Table.Cell>
              </Table.Row>
            );
          }
        })}
      </Table.Body>
    </Table>
  );
}

function handleHeaderClick(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  order: AdminQueryOrder | QueryOrder | undefined,
  reverse: boolean | undefined,
  headerOrder: QueryOrder
) {
  let newReverse = false;
  if (order === headerOrder) {
    newReverse = !reverse;
  }
  dispatchSearchEntityState(
    new SearchEntityStateActions.SetQuery({ order: headerOrder, reverse: newReverse }, true)
  );
}
