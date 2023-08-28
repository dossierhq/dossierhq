import type { AdminEntitiesQueryOrder, PublishedEntity } from '@dossierhq/core';
import { PublishedEntitiesQueryOrder } from '@dossierhq/core';
import { EmptyStateMessage, Table, toSizeClassName } from '@dossierhq/design';
import type { Dispatch } from 'react';
import { useContext } from 'react';
import { PublishedDossierContext } from '../../../contexts/PublishedDossierContext.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AuthKeyTag } from '../../../shared/components/AuthKeyTag/AuthKeyTag.js';
import type { DisplayAuthKey } from '../../../shared/types/DisplayAuthKey.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: PublishedEntity) => void;
}

export function PublishedEntityList({
  searchEntityState,
  dispatchSearchEntityState,
  onItemClick,
}: Props) {
  const {
    entities,
    query: { order, reverse },
  } = searchEntityState;
  const { authKeys } = useContext(PublishedDossierContext);

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
            order={order === PublishedEntitiesQueryOrder.name ? direction : ''}
            onClick={() =>
              handleHeaderClick(
                dispatchSearchEntityState,
                order,
                reverse,
                PublishedEntitiesQueryOrder.name,
              )
            }
          >
            Name
          </Table.Header>
          <Table.Header>Entity type</Table.Header>
          <Table.Header narrow>Auth key</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {isEmpty ? (
          <Table.Row>
            <Table.Cell className={toSizeClassName({ height: '100%' })} colSpan={3}>
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
              const entity = entityResult.value;
              return (
                <EntityListRow
                  key={entity.id}
                  {...{
                    entity,
                    authKeys,
                    order: order as PublishedEntitiesQueryOrder | undefined,
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
        <AuthKeyTag authKey={entity.info.authKey} authKeys={authKeys} />
      </Table.Cell>
    </Table.Row>
  );
}

function handleHeaderClick(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  order: AdminEntitiesQueryOrder | PublishedEntitiesQueryOrder | undefined,
  reverse: boolean | undefined,
  headerOrder: PublishedEntitiesQueryOrder,
) {
  let newReverse = false;
  if (order === headerOrder) {
    newReverse = !reverse;
  }
  dispatchSearchEntityState(
    new SearchEntityStateActions.SetQuery(
      { order: headerOrder, reverse: newReverse },
      { partial: true, resetPagingIfModifying: true },
    ),
  );
}
