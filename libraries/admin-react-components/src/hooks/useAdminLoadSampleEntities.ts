import type { AdminQuery, EntitySamplingOptions } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '..';
import { AdminDataDataContext, SearchEntityStateActions } from '..';
import { useAdminSampleEntities } from './useAdminSampleEntities';

/**
 * @param query If `undefined`, no data is fetched
 * @param options
 * @param dispatchSearchEntityState
 */
export function useAdminLoadSampleEntities(
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { entitySamples, entitySamplesError } = useAdminSampleEntities(adminClient, query, options);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSampleResult(entitySamples, entitySamplesError)
    );
  }, [entitySamples, entitySamplesError, dispatchSearchEntityState]);
}
