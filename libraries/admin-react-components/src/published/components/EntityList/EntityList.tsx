import type { AdminQueryOrder, PublishedEntity } from '@jonasb/datadata-core';
import { PublishedQueryOrder } from '@jonasb/datadata-core';
import { Table } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useContext } from 'react';
import type { DisplayAuthKey, SearchEntityState, SearchEntityStateAction } from '../../index.js';
import { AuthKeyTag, PublishedDataDataContext, SearchEntityStateActions } from '../../index.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: PublishedEntity) => void;
}

export function EntityList({ searchEntityState, dispatchSearchEntityState, onItemClick }: Props) {
  const {
    connection,
    entitySamples,
    query: { order, reverse },
  } = searchEntityState;
  const { authKeys } = useContext(PublishedDataDataContext);
  const direction = reverse ? 'desc' : 'asc';
  return (
    <Table>
      <Table.Head>
        <Table.Row sticky>
          <Table.Header
            order={order === PublishedQueryOrder.name ? direction : ''}
            onClick={() =>
              handleHeaderClick(dispatchSearchEntityState, order, reverse, PublishedQueryOrder.name)
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
              <EntityListRow
                key={entity.id}
                {...{
                  entity,
                  authKeys,
                  order: order as PublishedQueryOrder | undefined,
                  onItemClick,
                }}
              />
            );
          }
        })}
        {entitySamples?.items.map((entity) => (
          <EntityListRow
            key={entity.id}
            {...{
              entity: entity as PublishedEntity,
              authKeys,
              order: order as PublishedQueryOrder | undefined,
              onItemClick,
            }}
          />
        ))}
      </Table.Body>
    </Table>
  );
}

function EntityListRow({
  entity,
  authKeys,
  onItemClick,
}: {
  entity: PublishedEntity;
  authKeys: DisplayAuthKey[];
  onItemClick: (item: PublishedEntity) => void;
}) {
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

function handleHeaderClick(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  order: AdminQueryOrder | PublishedQueryOrder | undefined,
  reverse: boolean | undefined,
  headerOrder: PublishedQueryOrder
) {
  let newReverse = false;
  if (order === headerOrder) {
    newReverse = !reverse;
  }
  dispatchSearchEntityState(
    new SearchEntityStateActions.SetQuery(
      { order: headerOrder, reverse: newReverse },
      { partial: true, resetPaging: true }
    )
  );
}
