import type { AdminEntity, AdminQuery, Paging } from '@jonasb/datadata-core';
import {
  AdminQueryOrder,
  decodeUrlQueryStringifiedParam,
  stringifyUrlQueryParams,
} from '@jonasb/datadata-core';
import {
  Field,
  FullscreenContainer,
  Input,
  InstantDisplay,
  Table,
  TagSelector,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useContext, useEffect, useReducer } from 'react';
import type {
  EntityTypeSelectorDispatch,
  EntityTypeSelectorState,
  SearchEntityState,
  SearchEntityStateAction,
} from '../../index.js';
import {
  DataDataContext2,
  EntityTypeSelector,
  getQueryWithoutDefaults,
  initializeEntityTypeSelectorState,
  initializeSearchEntityState,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  SearchEntityPagingButtons,
  SearchEntityPagingCount,
  SearchEntityStateActions,
  StatusTag,
  TypePicker2,
  useSearchEntities,
  useTotalCount,
} from '../../index.js';

export interface EntityListScreenUrlQuery {
  query?: string;
  paging?: string;
}

export interface EntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlQuery?: EntityListScreenUrlQuery;
  onUrlQueryChanged?: (urlQuery: EntityListScreenUrlQuery) => void;
  onCreateEntity: (entityType: string) => void;
  onOpenEntity: (entity: AdminEntity) => void;
}

export function EntityListScreen({
  header,
  footer,
  urlQuery,
  onUrlQueryChanged,
  onCreateEntity,
  onOpenEntity,
}: EntityListScreenProps): JSX.Element | null {
  const { schema } = useContext(DataDataContext2);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlQuery,
    initializeSearchEntityStateFromUrlQuery
  );

  const [entityTypeFilterState, dispatchEntityTypeFilter] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: searchEntityState.query.entityTypes },
    initializeEntityTypeSelectorState
  );

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { entityTypes: entityTypeFilterState.selectedIds },
        true
      )
    );
  }, [entityTypeFilterState.selectedIds]);

  useSynchronizeUrlQueryState(
    urlQuery,
    onUrlQueryChanged,
    searchEntityState,
    dispatchSearchEntityState
  );

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  return (
    <FullscreenContainer>
      <SearchLoader
        query={searchEntityState.query as AdminQuery}
        paging={searchEntityState.paging}
        dispatchSearchEntityState={dispatchSearchEntityState}
      />
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <SearchInput {...{ searchEntityState, dispatchSearchEntityState }} />
        <EntityTypeSelector
          schema={schema}
          state={entityTypeFilterState}
          dispatch={dispatchEntityTypeFilter}
        >
          Entity type
        </EntityTypeSelector>
        <TypePicker2 iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
          Create
        </TypePicker2>
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <EntityTypesList state={entityTypeFilterState} dispatch={dispatchEntityTypeFilter} />
          <EntityList
            {...{ searchEntityState, dispatchSearchEntityState }}
            onItemClick={onOpenEntity}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row
        paddingVertical={2}
        columnGap={2}
        flexDirection="row"
        alignItems="center"
      >
        <SearchEntityPagingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
        <SearchEntityPagingCount {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}

function initializeSearchEntityStateFromUrlQuery(
  urlQuery: EntityListScreenUrlQuery | undefined
): SearchEntityState {
  const actions = urlQueryToSearchEntityStateActions(urlQuery);
  return initializeSearchEntityState(actions);
}

function urlQueryToSearchEntityStateActions(urlQuery: EntityListScreenUrlQuery | undefined) {
  const actions = [];
  if (urlQuery) {
    const decodedQuery: AdminQuery = decodeUrlQueryStringifiedParam('query', urlQuery) ?? {};
    actions.push(new SearchEntityStateActions.SetQuery(decodedQuery, false));
    const decodedPaging: Paging | undefined =
      decodeUrlQueryStringifiedParam('paging', urlQuery) ?? {};
    actions.push(new SearchEntityStateActions.SetPaging(decodedPaging));
  }
  return actions;
}

function useSynchronizeUrlQueryState(
  urlQuery: EntityListScreenUrlQuery | undefined,
  onUrlQueryChanged: ((urlQuery: EntityListScreenUrlQuery) => void) | undefined,
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { query, paging } = searchEntityState;
  useEffect(() => {
    if (!onUrlQueryChanged || !urlQuery) return;
    const result: EntityListScreenUrlQuery = stringifyUrlQueryParams({
      query: getQueryWithoutDefaults(query),
      paging,
    });
    if (result.paging !== urlQuery.paging || result.query !== urlQuery.query) {
      onUrlQueryChanged(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paging]);

  useEffect(() => {
    if (!urlQuery) return;
    const actions = urlQueryToSearchEntityStateActions(urlQuery);
    actions.forEach((action) => dispatchSearchEntityState(action));
  }, [dispatchSearchEntityState, urlQuery]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryState', { query, paging, urlQuery });
}

function SearchLoader({
  query,
  paging,
  dispatchSearchEntityState,
}: {
  query: AdminQuery;
  paging: Paging;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const { adminClient } = useContext(DataDataContext2);
  const { connection, connectionError } = useSearchEntities(adminClient, query, paging);
  const { totalCount } = useTotalCount(adminClient, query);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateResult(connection, connectionError)
    );
  }, [connection, connectionError, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);

  // useDebugLogChangedValues('SearchLoader changed values', { query, paging, dispatchSearchEntityState, adminClient, connection, connectionError, totalCount, });

  return null;
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

function EntityTypesList({
  state,
  dispatch,
}: {
  state: EntityTypeSelectorState;
  dispatch: EntityTypeSelectorDispatch;
}) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entity types</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.name })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}

function EntityList({
  searchEntityState,
  dispatchSearchEntityState,
  onItemClick,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: AdminEntity) => void;
}) {
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
