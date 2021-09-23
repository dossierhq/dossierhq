import type { AdminEntity, EntityPublishState } from '@jonasb/datadata-core';
import {
  FullscreenContainer,
  IconButton,
  Input,
  InstantDisplay,
  Table,
  Tag,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useContext, useEffect, useMemo, useReducer } from 'react';
import { DataDataContext, TypePicker } from '../..';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer';
import {
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from '../../reducers/SearchEntityReducer';

export interface EntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onCreateEntity: (entityType: string) => void;
  onOpenEntity: (entity: AdminEntity) => void;
}

export function EntityListScreen({
  header,
  footer,
  onCreateEntity,
  onOpenEntity,
}: EntityListScreenProps): JSX.Element | null {
  const { useSearchEntities } = useContext(DataDataContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    undefined,
    initializeSearchEntityState
  );
  const { connection, connectionError } = useSearchEntities(
    searchEntityState.query,
    searchEntityState.paging
  );
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateResult(connection, connectionError)
    );
  }, [connection, connectionError]);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2}>
        <SearchInput {...{ searchEntityState, dispatchSearchEntityState }} />
        <TypePicker showEntityTypes onTypeSelected={onCreateEntity} text="Create" />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <EntityList {...{ searchEntityState }} onItemClick={onOpenEntity} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row center paddingVertical={2}>
        <PagingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}

function SearchInput({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const { text } = searchEntityState;
  return (
    <Input
      iconLeft="search"
      value={text}
      placeholder="Search"
      onChange={(e) =>
        dispatchSearchEntityState(new SearchEntityStateActions.SetText(e.target.value))
      }
    />
  );
}

function EntityList({
  searchEntityState,
  onItemClick,
}: {
  searchEntityState: SearchEntityState;
  onItemClick: (item: AdminEntity) => void;
}) {
  const { connection } = searchEntityState;
  return (
    <Table>
      <Table.Head>
        <Table.Row sticky>
          <Table.Header>Name</Table.Header>
          <Table.Header>Entity type</Table.Header>
          <Table.Header narrow>Status</Table.Header>
          <Table.Header narrow>Created</Table.Header>
          <Table.Header narrow>Updated</Table.Header>
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
                  <StatusTag status={entity.info.publishingState} />
                </Table.Cell>
                <Table.Cell narrow>
                  <InstantDisplay instant={entity.info.createdAt} />
                </Table.Cell>
                <Table.Cell narrow>
                  {entity.info.updatedAt.equals(entity.info.createdAt) ? null : (
                    <InstantDisplay instant={entity.info.updatedAt} />
                  )}
                </Table.Cell>
              </Table.Row>
            );
          }
        })}
      </Table.Body>
    </Table>
  );
}

function PagingButtons({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const { connection, paging, pagingCount } = searchEntityState;

  const handleStart = useMemo(() => {
    return paging.last || paging.after || paging.before
      ? () =>
          dispatchSearchEntityState(new SearchEntityStateActions.SetPaging({ first: pagingCount }))
      : undefined;
  }, [paging.last, paging.after, paging.before, dispatchSearchEntityState, pagingCount]);

  const handlePrevious = useMemo(() => {
    return connection?.pageInfo.hasPreviousPage
      ? () =>
          dispatchSearchEntityState(
            new SearchEntityStateActions.SetPaging({
              last: pagingCount,
              before: connection.pageInfo.startCursor,
            })
          )
      : undefined;
  }, [
    connection?.pageInfo.hasPreviousPage,
    connection?.pageInfo.startCursor,
    dispatchSearchEntityState,
    pagingCount,
  ]);

  const handleNext = useMemo(() => {
    return connection?.pageInfo.hasNextPage
      ? () =>
          dispatchSearchEntityState(
            new SearchEntityStateActions.SetPaging({
              first: pagingCount,
              after: connection.pageInfo.endCursor,
            })
          )
      : undefined;
  }, [
    connection?.pageInfo.endCursor,
    connection?.pageInfo.hasNextPage,
    dispatchSearchEntityState,
    pagingCount,
  ]);

  const handleEnd = useMemo(() => {
    return connection?.pageInfo.hasNextPage
      ? () =>
          dispatchSearchEntityState(new SearchEntityStateActions.SetPaging({ last: pagingCount }))
      : undefined;
  }, [connection?.pageInfo.hasNextPage, dispatchSearchEntityState, pagingCount]);

  return (
    <IconButton.Group condensed>
      <IconButton icon="first" disabled={!handleStart} onClick={handleStart} />
      <IconButton icon="previous" disabled={!handlePrevious} onClick={handlePrevious} />
      <IconButton icon="next" disabled={!handleNext} onClick={handleNext} />
      <IconButton icon="last" disabled={!handleEnd} onClick={handleEnd} />
    </IconButton.Group>
  );
}

function StatusTag({ status }: { status: EntityPublishState }) {
  return <Tag color={status}>{status.slice(0, 1).toUpperCase() + status.slice(1)}</Tag>;
}
