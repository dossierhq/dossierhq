import type { AdminQuery, AdminSearchQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import { AdminDataDataContext, useAdminSearchEntities, useAdminTotalCount } from '..';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { useAdminSampleEntities } from './useAdminSampleEntities';

export function useAdminLoadEntitySearch(
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { adminClient } = useContext(AdminDataDataContext);

  // search
  const searchQuery = searchEntityState.paging
    ? (searchEntityState.query as AdminSearchQuery)
    : undefined;
  const { connection, connectionError } = useAdminSearchEntities(
    adminClient,
    searchQuery,
    searchEntityState.paging
  );
  const { totalCount } = useAdminTotalCount(adminClient, searchQuery);

  // sample
  const sampleQuery = !searchQuery ? (searchEntityState.query as AdminQuery) : undefined;
  const { entitySamples, entitySamplesError } = useAdminSampleEntities(
    adminClient,
    sampleQuery,
    searchEntityState.sampling
  );

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSearchResult(connection, connectionError)
    );
  }, [connection, connectionError, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSampleResult(entitySamples, entitySamplesError)
    );
  }, [entitySamples, entitySamplesError, dispatchSearchEntityState]);
}
