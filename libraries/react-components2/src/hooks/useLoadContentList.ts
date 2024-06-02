import type {
  Connection,
  Edge,
  Entity,
  EntityQuery,
  EntitySamplingPayload,
  EntitySharedQuery,
  ErrorType,
} from '@dossierhq/core';
import { useEffect, type Dispatch } from 'react';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { useEntities } from './useEntities.js';
import { useEntitiesSample } from './useEntitiesSample.js';
import { useEntitiesTotalCount } from './useEntitiesTotalCount.js';

export function useLoadContentList(
  searchEntityState: ContentListState,
  dispatchContentListState: Dispatch<ContentListStateAction>,
) {
  // search
  const searchQuery = searchEntityState.paging
    ? (searchEntityState.query as EntityQuery)
    : undefined;
  const { connection, connectionError } = useEntities(searchQuery, searchEntityState.paging);
  const { totalCount } = useEntitiesTotalCount(searchQuery);

  // sample
  const sampleQuery = !searchQuery ? (searchEntityState.query as EntitySharedQuery) : undefined;
  const { entitiesSample, entitiesSampleError } = useEntitiesSample(
    sampleQuery,
    searchEntityState.sampling,
  );

  useEffect(() => {
    dispatchContentListState(
      new ContentListStateActions.UpdateSearchResult(
        connection as Connection<Edge<Entity, ErrorType>> | null,
        connectionError,
      ),
    );
  }, [connection, connectionError, dispatchContentListState]);

  useEffect(() => {
    dispatchContentListState(new ContentListStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchContentListState]);

  useEffect(() => {
    dispatchContentListState(
      new ContentListStateActions.UpdateSampleResult(
        entitiesSample as EntitySamplingPayload<Entity>,
        entitiesSampleError,
      ),
    );
  }, [entitiesSample, entitiesSampleError, dispatchContentListState]);
}
