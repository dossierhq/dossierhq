import type {
  EntityQuery,
  AdminEntitySharedQuery,
  AdminEntity,
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
} from '../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { useAdminEntities } from './useAdminEntities.js';
import { useAdminEntitiesSample } from './useAdminEntitiesSample.js';
import { useAdminEntitiesTotalCount } from './useAdminEntitiesTotalCount.js';

export function useAdminLoadEntitySearch(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
) {
  const { adminClient } = useContext(AdminDossierContext);

  // search
  const searchQuery = searchEntityState.paging
    ? (searchEntityState.query as EntityQuery)
    : undefined;
  const { connection, connectionError } = useAdminEntities(
    adminClient,
    searchQuery,
    searchEntityState.paging,
  );
  const { totalCount } = useAdminEntitiesTotalCount(adminClient, searchQuery);

  // sample
  const sampleQuery = !searchQuery
    ? (searchEntityState.query as AdminEntitySharedQuery)
    : undefined;
  const { entitiesSample, entitiesSampleError } = useAdminEntitiesSample(
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
        entitiesSample as EntitySamplingPayload<AdminEntity>,
        entitiesSampleError,
      ),
    );
  }, [entitiesSample, entitiesSampleError, dispatchSearchEntityState]);
}
