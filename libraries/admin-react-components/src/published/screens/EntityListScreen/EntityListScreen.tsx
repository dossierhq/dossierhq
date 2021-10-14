import type { Entity, Paging, Query } from '@jonasb/datadata-core';
import {
  decodeUrlQueryStringifiedParam,
  QueryOrder,
  stringifyUrlQueryParams,
} from '@jonasb/datadata-core';
import { FullscreenContainer, Table } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useContext, useEffect, useReducer } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../index.js';
import {
  EntityTypeSelector,
  EntityTypeTagSelector,
  getQueryWithoutDefaults,
  initializeEntityTypeSelectorState,
  initializeSearchEntityState,
  PublishedDataDataContext,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  SearchEntityPagingButtons,
  SearchEntityPagingCount,
  SearchEntitySearchInput,
  SearchEntityStateActions,
  useLoadSearchEntity,
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
  onOpenEntity: (entity: Entity) => void;
}

export function EntityListScreen({
  header,
  footer,
  urlQuery,
  onUrlQueryChanged,
  onOpenEntity,
}: EntityListScreenProps): JSX.Element | null {
  const { schema } = useContext(PublishedDataDataContext);
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

  useLoadSearchEntity(
    searchEntityState.query as Query,
    searchEntityState.paging,
    dispatchSearchEntityState
  );

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <SearchEntitySearchInput {...{ searchEntityState, dispatchSearchEntityState }} />
        <EntityTypeSelector
          schema={schema}
          state={entityTypeFilterState}
          dispatch={dispatchEntityTypeFilter}
        >
          Entity type
        </EntityTypeSelector>
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <EntityTypeTagSelector
            state={entityTypeFilterState}
            dispatch={dispatchEntityTypeFilter}
          />
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
    const decodedQuery: Query = decodeUrlQueryStringifiedParam('query', urlQuery) ?? {};
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

function EntityList({
  searchEntityState,
  dispatchSearchEntityState,
  onItemClick,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
  onItemClick: (item: Entity) => void;
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
