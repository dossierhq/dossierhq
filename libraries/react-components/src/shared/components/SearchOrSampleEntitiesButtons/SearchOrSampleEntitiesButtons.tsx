import { IconButton } from '@dossierhq/design';
import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type {
  SearchEntityState,
  SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SearchEntityStateActions } from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';
import { SampleEntitiesOptionsCount } from '../SampleEntitiesOptionsCount/SampleEntitiesOptionsCount.js';
import { SearchEntityPagingButtons } from '../SearchEntityPagingButtons/SearchEntityPagingButtons.js';
import { SearchEntityPagingCount } from '../SearchEntityPagingCount/SearchEntityPagingCount.js';

export function SearchOrSampleEntitiesButtons({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  return searchEntityState.sampling ? (
    <SamplingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
  ) : (
    <SearchButtons {...{ searchEntityState, dispatchSearchEntityState }} />
  );
}

function SearchButtons({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const handleEnableSample = useCallback(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.SetSampling({}, false));
  }, [dispatchSearchEntityState]);

  return (
    <>
      <SearchEntityPagingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      <SearchEntityPagingCount {...{ searchEntityState, dispatchSearchEntityState }} />
      <IconButton icon="shuffle" onClick={handleEnableSample} />
    </>
  );
}

function SamplingButtons({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const handleOrdered = useCallback(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.SetPaging({}, 'first-page'));
  }, [dispatchSearchEntityState]);

  const handleChangeSeed = useCallback(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.SetSampling({ seed: undefined }, true));
  }, [dispatchSearchEntityState]);

  return (
    <>
      <SampleEntitiesOptionsCount {...{ searchEntityState, dispatchSearchEntityState }} />
      <IconButton icon="shuffle" onClick={handleChangeSeed} />
      <IconButton icon="ordered" onClick={handleOrdered} />
    </>
  );
}
