import { IconButton } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../../index.js';
import {
  SampleEntitiesOptionsCount,
  SearchEntityPagingButtons,
  SearchEntityPagingCount,
  SearchEntityStateActions,
} from '../../../index.js';

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
    dispatchSearchEntityState(new SearchEntityStateActions.SetPaging({}));
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
