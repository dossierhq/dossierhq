import type {
  Connection,
  Edge,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntity,
  PublishedEntityQuery,
  PublishedEntitySharedQuery,
} from '@dossierhq/core';
import { useContext, useEffect, type Dispatch } from 'react';
import { PublishedDossierContext } from '../contexts/PublishedDossierContext.js';
import {
  SearchEntityStateActions,
  type SearchEntityState,
  type SearchEntityStateAction,
} from '../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { usePublishedEntities } from './usePublishedEntities.js';
import { usePublishedEntitiesSample } from './usePublishedEntitiesSample.js';
import { usePublishedEntitiesTotalCount } from './usePublishedEntitiesTotalCount.js';

export function usePublishedLoadEntitySearch(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
) {
  const { publishedClient } = useContext(PublishedDossierContext);

  // search
  const searchQuery = searchEntityState.paging
    ? (searchEntityState.query as PublishedEntityQuery)
    : undefined;
  const { connection, connectionError } = usePublishedEntities(
    publishedClient,
    searchQuery,
    searchEntityState.paging,
  );
  const { totalCount } = usePublishedEntitiesTotalCount(publishedClient, searchQuery);

  // sample
  const sampleQuery = !searchQuery
    ? (searchEntityState.query as PublishedEntitySharedQuery)
    : undefined;
  const { entitiesSample, entitiesSampleError } = usePublishedEntitiesSample(
    publishedClient,
    sampleQuery,
    searchEntityState.sampling,
  );

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSearchResult(
        connection as Connection<Edge<PublishedEntity, ErrorType>> | null,
        connectionError,
      ),
    );
  }, [connection, connectionError, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSampleResult(
        entitiesSample as EntitySamplingPayload<PublishedEntity>,
        entitiesSampleError,
      ),
    );
  }, [entitiesSample, entitiesSampleError, dispatchSearchEntityState]);
}
