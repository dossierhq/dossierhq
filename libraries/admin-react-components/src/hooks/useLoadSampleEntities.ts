import type { AdminQuery, EntitySamplingOptions } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '..';
import { AdminDataDataContext, SearchEntityStateActions } from '..';
import { useSampleEntities } from './useSampleEntities';

/**
 * @param query If `undefined`, no data is fetched
 * @param options
 * @param dispatchSearchEntityState
 */
export function useLoadSampleEntities(
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { entitySamples, entitySamplesError } = useSampleEntities(adminClient, query, options);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSampleResult(entitySamples, entitySamplesError)
    );
  }, [entitySamples, entitySamplesError, dispatchSearchEntityState]);
}
