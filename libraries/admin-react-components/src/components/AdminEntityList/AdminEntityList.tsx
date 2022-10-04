import type { AdminEntity, PublishedQueryOrder } from '@jonasb/datadata-core';
import { AdminQueryOrder } from '@jonasb/datadata-core';
import { DateDisplay, EmptyStateMessage, Table, toSizeClassName } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import { useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { AuthKeyTag } from '../../shared/components/AuthKeyTag/AuthKeyTag.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import type { DisplayAuthKey } from '../../shared/types/DisplayAuthKey.js';
import { StatusTag } from '../StatusTag/StatusTag.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: AdminEntity) => void;
}

export function AdminEntityList({
  searchEntityState,
  dispatchSearchEntityState,
  onItemClick,
}: Props) {
  const {
    entities,
    query: { order, reverse },
  } = searchEntityState;
  const { authKeys } = useContext(AdminDataDataContext);

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
              const entity = entityResult.value as AdminEntity;
              return (
                <EntityListRow
                  key={entity.id}
                  {...{
                    entity,
                    authKeys,
                    order: order as AdminQueryOrder | undefined,
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
        <DateDisplay date={entity.info.createdAt} />
      </Table.Cell>
      <Table.Cell narrow>
        {order === AdminQueryOrder.updatedAt ||
        entity.info.updatedAt.getTime() !== entity.info.createdAt.getTime() ? (
          <DateDisplay date={entity.info.updatedAt} />
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
      { partial: true, resetPagingIfModifying: true }
    )
  );
}
