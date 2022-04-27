import type { EntitySamplingOptions, PublishedQuery } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext, useEffect } from 'react';
import { PublishedDataDataContext } from '..';
import { SearchEntityStateActions } from '../..';
import type { SearchEntityStateAction } from '../../';
import { usePublishedSampleEntities } from './usePublishedSampleEntities';

/**
 * @param query If `undefined`, no data is fetched
 * @param options
 * @param dispatchSearchEntityState
 */
export function useLoadPublishedSampleEntities(
  query: PublishedQuery | undefined,
  options: EntitySamplingOptions | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { publishedClient } = useContext(PublishedDataDataContext);
  const { entitySamples, entitySamplesError } = usePublishedSampleEntities(
    publishedClient,
    query,
    options
  );

  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateSampleResult(entitySamples, entitySamplesError)
    );
  }, [dispatchSearchEntityState, entitySamples, entitySamplesError]);
}
