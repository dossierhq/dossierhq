import type {
  AdminEntity,
  AdminQuery,
  AdminSearchQuery,
  Connection,
  Edge,
  EntitySamplingPayload,
  ErrorType,
} from '@dossierhq/core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import { AdminDossierContext } from '../contexts/AdminDossierContext.js';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { useAdminSampleEntities } from './useAdminSampleEntities.js';
import { useAdminSearchEntities } from './useAdminSearchEntities.js';
import { useAdminTotalCount } from './useAdminTotalCount.js';

export function useAdminLoadEntitySearch(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
) {
  const { adminClient } = useContext(AdminDossierContext);

  // search
  const searchQuery = searchEntityState.paging
    ? (searchEntityState.query as AdminSearchQuery)
    : undefined;
  const { connection, connectionError } = useAdminSearchEntities(
    adminClient,
    searchQuery,
    searchEntityState.paging,
  );
  const { totalCount } = useAdminTotalCount(adminClient, searchQuery);

  // sample
  const sampleQuery = !searchQuery ? (searchEntityState.query as AdminQuery) : undefined;
  const { entitySamples, entitySamplesError } = useAdminSampleEntities(
    adminClient,
    sampleQuery,
    searchEntityState.sampling,
  );

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSearchResult(
        connection as Connection<Edge<AdminEntity, ErrorType>> | null,
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
        entitySamples as EntitySamplingPayload<AdminEntity>,
        entitySamplesError,
      ),
    );
  }, [entitySamples, entitySamplesError, dispatchSearchEntityState]);
}
