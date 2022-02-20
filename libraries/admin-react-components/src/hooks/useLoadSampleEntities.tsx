import type { AdminQuery, EntitySamplingOptions } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '../index.js';
import { DataDataContext2, SearchEntityStateActions } from '../index.js';
import { useSampleEntities } from './useSampleEntities.js';

/**
 * @param dispatchSearchEntityState
 * @param query If `undefined`, no data is fetched
 * @param options
 */
export function useLoadSampleEntities(
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined
) {
  const { adminClient } = useContext(DataDataContext2);
  const { entitySamples, entitySamplesError } = useSampleEntities(adminClient, query, options);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSampleResult(entitySamples, entitySamplesError)
    );
  }, [entitySamples, entitySamplesError, dispatchSearchEntityState]);
}
