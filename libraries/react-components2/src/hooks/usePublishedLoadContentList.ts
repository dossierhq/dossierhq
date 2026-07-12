import type {
  Connection,
  Edge,
  Entity,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntityQuery,
  PublishedEntitySharedQuery,
} from '@dossierhq/core';
import { useEffect, type Dispatch } from 'react';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { usePublishedEntities } from './usePublishedEntities.js';
import { usePublishedEntitiesSample } from './usePublishedEntitiesSample.js';
import { usePublishedEntitiesTotalCount } from './usePublishedEntitiesTotalCount.js';

export function usePublishedLoadContentList(
  searchEntityState: ContentListState,
  dispatchContentList: Dispatch<ContentListStateAction>,
) {
  const enabled = searchEntityState.mode === 'published';

  // search
  const searchQuery =
    enabled && searchEntityState.paging
      ? (searchEntityState.query as PublishedEntityQuery)
      : undefined;
  const { connection, connectionError } = usePublishedEntities(
    searchQuery,
    searchEntityState.paging,
  );
  const { totalCount } = usePublishedEntitiesTotalCount(searchQuery);

  // sample
  const sampleQuery =
    enabled && !searchQuery ? (searchEntityState.query as PublishedEntitySharedQuery) : undefined;
  const { entitiesSample, entitiesSampleError } = usePublishedEntitiesSample(
    sampleQuery,
    searchEntityState.sampling,
  );

  useEffect(() => {
    dispatchContentList(
      new ContentListStateActions.UpdateSearchResult(
        connection as Connection<Edge<Entity, ErrorType>> | null,
        connectionError,
      ),
    );
  }, [connection, connectionError, dispatchContentList]);

  useEffect(() => {
    dispatchContentList(new ContentListStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchContentList]);

  useEffect(() => {
    dispatchContentList(
      new ContentListStateActions.UpdateSampleResult(
        entitiesSample as EntitySamplingPayload<Entity>,
        entitiesSampleError,
      ),
    );
  }, [entitiesSample, entitiesSampleError, dispatchContentList]);
}
