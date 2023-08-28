import type { AdminEntity, PublishedEntitiesQueryOrder } from '@dossierhq/core';
import { AdminEntitiesQueryOrder } from '@dossierhq/core';
import { DateDisplay, EmptyStateMessage, Table, Tag, toSizeClassName } from '@dossierhq/design';
import type { Dispatch } from 'react';
import { useContext } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AuthKeyTag } from '../../shared/components/AuthKeyTag/AuthKeyTag.js';
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
  const { authKeys } = useContext(AdminDossierContext);

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
            order={order === AdminEntitiesQueryOrder.name ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                AdminEntitiesQueryOrder.name,
              )
            }
          >
            Name
          </Table.Header>
          <Table.Header>Entity type</Table.Header>
          <Table.Header narrow>Status</Table.Header>
          <Table.Header narrow>Auth key</Table.Header>
          <Table.Header
            narrow
            order={order === AdminEntitiesQueryOrder.createdAt ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                AdminEntitiesQueryOrder.createdAt,
              )
            }
          >
            Created
          </Table.Header>
          <Table.Header
            narrow
            order={order === AdminEntitiesQueryOrder.updatedAt ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                AdminEntitiesQueryOrder.updatedAt,
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
                    order: order as AdminEntitiesQueryOrder | undefined,
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
  order: AdminEntitiesQueryOrder | undefined;
  authKeys: DisplayAuthKey[];
  onItemClick: (item: AdminEntity) => void;
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
      <Table.Cell narrow>
        <AuthKeyTag authKey={entity.info.authKey} authKeys={authKeys} />
      </Table.Cell>
      <Table.Cell narrow>
        <DateDisplay date={entity.info.createdAt} />
      </Table.Cell>
      <Table.Cell narrow>
        {order === AdminEntitiesQueryOrder.updatedAt ||
        entity.info.updatedAt.getTime() !== entity.info.createdAt.getTime() ? (
          <DateDisplay date={entity.info.updatedAt} />
        ) : null}
      </Table.Cell>
    </Table.Row>
  );
}

function handleHeaderClick(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  order: AdminEntitiesQueryOrder | PublishedEntitiesQueryOrder | undefined,
  reverse: boolean | undefined,
  headerOrder: AdminEntitiesQueryOrder | PublishedEntitiesQueryOrder,
) {
  let newReverse = false;
  if (order === headerOrder) {
    newReverse = !reverse;
  } else if (
    headerOrder === AdminEntitiesQueryOrder.updatedAt ||
    headerOrder === AdminEntitiesQueryOrder.createdAt
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
