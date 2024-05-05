import { EntityQueryOrder, type Entity, type PublishedEntityQueryOrder } from '@dossierhq/core';
import { DateDisplay, EmptyStateMessage, Table, Tag, toSizeClassName } from '@dossierhq/design';
import { useContext, type Dispatch } from 'react';
import { DossierContext } from '../../contexts/DossierContext.js';
import {
  SearchEntityStateActions,
  type SearchEntityState,
  type SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import type { DisplayAuthKey } from '../../types/DisplayAuthKey.js';
import { AuthKeyTag } from '../AuthKeyTag/AuthKeyTag.js';
import { StatusTag } from '../StatusTag/StatusTag.js';

interface Props {
  searchEntityState: SearchEntityState;
  showAuthKeys: boolean;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: Entity) => void;
}

export function AdminEntityList({
  searchEntityState,
  showAuthKeys,
  dispatchSearchEntityState,
  onItemClick,
}: Props) {
  const {
    entities,
    query: { order, reverse },
  } = searchEntityState;
  const { authKeys } = useContext(DossierContext);

  const direction = reverse ? 'desc' : 'asc';
  const isEmpty = searchEntityState.entities?.length === 0;

  return (
    <Table
      className={isEmpty ? toSizeClassName({ height: '100%' }) : undefined}
      hoverable={!isEmpty}
    >
      <Table.Head>
        <Table.Row sticky>
          <Table.Header
            order={order === EntityQueryOrder.name ? direction : ''}
            onClick={() =>
              handleHeaderClick(dispatchSearchEntityState, order, reverse, EntityQueryOrder.name)
            }
          >
            Name
          </Table.Header>
          <Table.Header>Entity type</Table.Header>
          <Table.Header narrow>Status</Table.Header>
          {showAuthKeys && <Table.Header narrow>Auth key</Table.Header>}
          <Table.Header
            narrow
            order={order === EntityQueryOrder.createdAt ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                EntityQueryOrder.createdAt,
              )
            }
          >
            Created
          </Table.Header>
          <Table.Header
            narrow
            order={order === EntityQueryOrder.updatedAt ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                EntityQueryOrder.updatedAt,
              )
            }
          >
            Updated
          </Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {isEmpty ? (
          <Table.Row>
            <Table.Cell className={toSizeClassName({ height: '100%' })} colSpan={6}>
              <EmptyStateMessage
                icon="search"
                title="No matches"
                message="No entities match the query"
              />
            </Table.Cell>
          </Table.Row>
        ) : (
          entities?.map((entityResult) => {
            if (entityResult.isOk()) {
              const entity = entityResult.value as Entity;
              return (
                <EntityListRow
                  key={entity.id}
                  {...{
                    entity,
                    authKeys,
                    order: order as EntityQueryOrder | undefined,
                    showAuthKeys,
                    onItemClick,
                  }}
                />
              );
            }
          })
        )}
      </Table.Body>
    </Table>
  );
}

function EntityListRow({
  entity,
  order,
  authKeys,
  showAuthKeys,
  onItemClick,
}: {
  entity: Entity;
  order: EntityQueryOrder | undefined;
  authKeys: DisplayAuthKey[];
  showAuthKeys: boolean;
  onItemClick: (item: Entity) => void;
}) {
  return (
    <Table.Row clickable onClick={() => onItemClick(entity)}>
      <Table.Cell>{entity.info.name}</Table.Cell>
      <Table.Cell>{entity.info.type}</Table.Cell>
      <Table.Cell narrow>
        <StatusTag status={entity.info.status} />
        {!entity.info.valid || entity.info.validPublished === false ? (
          <>
            {' '}
            <Tag color="danger">Invalid</Tag>
          </>
        ) : null}
      </Table.Cell>
      {showAuthKeys && (
        <Table.Cell narrow>
          {!!entity.info.authKey && (
            <AuthKeyTag authKey={entity.info.authKey} authKeys={authKeys} />
          )}
        </Table.Cell>
      )}
      <Table.Cell narrow>
        <DateDisplay date={entity.info.createdAt} />
      </Table.Cell>
      <Table.Cell narrow>
        {order === EntityQueryOrder.updatedAt ||
        entity.info.updatedAt.getTime() !== entity.info.createdAt.getTime() ? (
          <DateDisplay date={entity.info.updatedAt} />
        ) : null}
      </Table.Cell>
    </Table.Row>
  );
}

function handleHeaderClick(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  order: EntityQueryOrder | PublishedEntityQueryOrder | undefined,
  reverse: boolean | undefined,
  headerOrder: EntityQueryOrder | PublishedEntityQueryOrder,
) {
  let newReverse = false;
  if (order === headerOrder) {
    newReverse = !reverse;
  } else if (
    headerOrder === EntityQueryOrder.updatedAt ||
    headerOrder === EntityQueryOrder.createdAt
  ) {
    // Default to descending order for dates
    newReverse = true;
  }
  dispatchSearchEntityState(
    new SearchEntityStateActions.SetQuery(
      { order: headerOrder, reverse: newReverse },
      { partial: true, resetPagingIfModifying: true },
    ),
  );
}
