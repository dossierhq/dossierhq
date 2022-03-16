import type { AdminEntity, PublishedQueryOrder } from '@jonasb/datadata-core';
import { AdminQueryOrder } from '@jonasb/datadata-core';
import { InstantDisplay, Table } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useContext } from 'react';
import type { DisplayAuthKey, SearchEntityState, SearchEntityStateAction } from '../..';
import { AuthKeyTag, DataDataContext2, SearchEntityStateActions, StatusTag } from '../..';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: AdminEntity) => void;
}

export function EntityList2({ searchEntityState, dispatchSearchEntityState, onItemClick }: Props) {
  const {
    connection,
    entitySamples,
    query: { order, reverse },
  } = searchEntityState;
  const { authKeys } = useContext(DataDataContext2);

  const direction = reverse ? 'desc' : 'asc';
  return (
    <Table>
      <Table.Head>
        <Table.Row sticky>
          <Table.Header
            order={order === AdminQueryOrder.name ? direction : ''}
            onClick={() =>
              handleHeaderClick(dispatchSearchEntityState, order, reverse, AdminQueryOrder.name)
            }
          >
            Name
          </Table.Header>
          <Table.Header>Entity type</Table.Header>
          <Table.Header narrow>Status</Table.Header>
          <Table.Header narrow>Auth key</Table.Header>
          <Table.Header
            narrow
            order={order === AdminQueryOrder.createdAt ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                AdminQueryOrder.createdAt
              )
            }
          >
            Created
          </Table.Header>
          <Table.Header
            narrow
            order={order === AdminQueryOrder.updatedAt ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                AdminQueryOrder.updatedAt
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
              <EntityListRow
                key={entity.id}
                {...{ entity, authKeys, order: order as AdminQueryOrder | undefined, onItemClick }}
              />
            );
          }
        })}
        {entitySamples?.items.map((entity) => (
          <EntityListRow
            key={entity.id}
            {...{
              entity: entity as AdminEntity,
              authKeys,
              order: order as AdminQueryOrder | undefined,
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
  order,
  authKeys,
  onItemClick,
}: {
  entity: AdminEntity;
  order: AdminQueryOrder | undefined;
  authKeys: DisplayAuthKey[];
  onItemClick: (item: AdminEntity) => void;
}) {
  return (
    <Table.Row clickable onClick={() => onItemClick(entity)}>
      <Table.Cell>{entity.info.name}</Table.Cell>
      <Table.Cell>{entity.info.type}</Table.Cell>
      <Table.Cell narrow>
        <StatusTag status={entity.info.status} />
      </Table.Cell>
      <Table.Cell narrow>
        <AuthKeyTag
          authKey={entity.info.authKey}
          displayName={
            authKeys.find((it) => it.authKey === entity.info.authKey)?.displayName ?? null
          }
        />
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

function handleHeaderClick(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  order: AdminQueryOrder | PublishedQueryOrder | undefined,
  reverse: boolean | undefined,
  headerOrder: AdminQueryOrder
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
