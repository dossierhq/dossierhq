import type { Paging } from '@dossierhq/core';
import { ArrowDownNarrowWideIcon, ShuffleIcon } from 'lucide-react';
import { useCallback, type Dispatch } from 'react';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { ConnectionPagingButtons } from './ConnectionPagingButtons.js';
import { Button } from './ui/button.js';

interface Props {
  className?: string;
  contentListState: ContentListState;
  dispatchContentListState: Dispatch<ContentListStateAction>;
}

export function ContentListPagingButtons(props: Props) {
  return props.contentListState.sampling ? (
    <SamplingButtons {...props} />
  ) : (
    <SearchButtons {...props} />
  );
}

function SearchButtons({ className, contentListState, dispatchContentListState }: Props) {
  const handleEnableSample = useCallback(() => {
    dispatchContentListState(new ContentListStateActions.SetSampling({}, false));
  }, [dispatchContentListState]);

  const handlePagingChange = useCallback(
    (paging: Paging, pagingAction: 'first-page' | 'prev-page' | 'next-page' | 'last-page') => {
      dispatchContentListState(new ContentListStateActions.SetPaging(paging, pagingAction));
    },
    [dispatchContentListState],
  );

  return (
    <div className={className}>
      <ConnectionPagingButtons
        connection={contentListState.connection}
        pagingCount={contentListState.requestedCount}
        onPagingChange={handlePagingChange}
      />
      {/*
      <SearchEntityPagingCount {...{ searchEntityState, dispatchSearchEntityState }} /> */}
      <Button variant="outline" size="icon" onClick={handleEnableSample}>
        <ShuffleIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SamplingButtons({ className, contentListState: _, dispatchContentListState }: Props) {
  const handleOrdered = useCallback(() => {
    dispatchContentListState(new ContentListStateActions.SetPaging({}, 'first-page'));
  }, [dispatchContentListState]);

  const handleChangeSeed = useCallback(() => {
    dispatchContentListState(new ContentListStateActions.SetSampling({ seed: undefined }, true));
  }, [dispatchContentListState]);

  return (
    <div className={className}>
      {/* <SampleEntitiesOptionsCount {...{ contentListState, dispatchContentListState }} /> */}
      <Button variant="outline" size="icon" onClick={handleChangeSeed}>
        <ShuffleIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleOrdered}>
        <ArrowDownNarrowWideIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
