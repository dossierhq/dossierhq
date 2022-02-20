import type { EntitySamplingOptions, PublishedQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import type { SearchEntityStateAction } from '../index.js';
import { PublishedDataDataContext, SearchEntityStateActions } from '../index.js';
import { useSampleEntities } from './useSampleEntities.js';

/**
 * @param query If `undefined`, no data is fetched
 * @param options
 * @param dispatchSearchEntityState
 */
export function useLoadSampleEntities(
  query: PublishedQuery | undefined,
  options: EntitySamplingOptions | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { publishedClient } = useContext(PublishedDataDataContext);
  const { entitySamples, entitySamplesError } = useSampleEntities(publishedClient, query, options);

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSampleResult(entitySamples, entitySamplesError)
    );
  }, [dispatchSearchEntityState, entitySamples, entitySamplesError]);
}
