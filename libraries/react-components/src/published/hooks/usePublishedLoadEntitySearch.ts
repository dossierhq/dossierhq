import type {
  Connection,
  Edge,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntity,
  PublishedQuery,
  PublishedSearchQuery,
} from '@dossierhq/core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { usePublishedSampleEntities } from './usePublishedSampleEntities.js';
import { usePublishedSearchEntities } from './usePublishedSearchEntities.js';
import { usePublishedTotalCount } from './usePublishedTotalCount.js';

export function usePublishedLoadEntitySearch(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
) {
  const { publishedClient } = useContext(PublishedDossierContext);

  // search
  const searchQuery = searchEntityState.paging
    ? (searchEntityState.query as PublishedSearchQuery)
    : undefined;
  const { connection, connectionError } = usePublishedSearchEntities(
    publishedClient,
    searchQuery,
    searchEntityState.paging,
  );
  const { totalCount } = usePublishedTotalCount(publishedClient, searchQuery);

  // sample
  const sampleQuery = !searchQuery ? (searchEntityState.query as PublishedQuery) : undefined;
  const { entitySamples, entitySamplesError } = usePublishedSampleEntities(
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
        entitySamples as EntitySamplingPayload<PublishedEntity>,
        entitySamplesError,
      ),
    );
  }, [entitySamples, entitySamplesError, dispatchSearchEntityState]);
}
