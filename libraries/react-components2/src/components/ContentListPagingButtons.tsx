import type { Paging } from '@dossierhq/core';
import { ArrowDownNarrowWideIcon, ShuffleIcon } from 'lucide-react';
import { useCallback, useState, type Dispatch } from 'react';
import { cn } from '../lib/utils.js';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { ConnectionPagingButtons } from './ConnectionPagingButtons.js';
import { ConnectionPagingCount } from './ConnectionPagingCount.js';
import { Button } from './ui/button.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';

interface Props {
  className?: string;
  contentListState: ContentListState;
  dispatchContentListState: Dispatch<ContentListStateAction>;
}

export function ContentListPagingButtons({ className, ...props }: Props) {
  const className2 = cn('flex justify-center gap-2', className);
  return props.contentListState.sampling ? (
    <SamplingButtons className={className2} {...props} />
  ) : (
    <SearchButtons className={className2} {...props} />
  );
}

function SearchButtons({ className, contentListState, dispatchContentListState }: Props) {
  const handleEnableSample = useCallback(() => {
    dispatchContentListState(new ContentListStateActions.SetSampling({}, false));
  }, [dispatchContentListState]);

  const handlePagingChange = useCallback(
    (paging: Paging, pagingAction?: 'first-page' | 'prev-page' | 'next-page' | 'last-page') => {
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
      <ConnectionPagingCount
        connection={contentListState.connection}
        paging={contentListState.paging}
        pagingCount={contentListState.requestedCount}
        totalCount={contentListState.totalCount}
        onPagingChange={handlePagingChange}
      />
      <Button variant="outline" size="icon" onClick={handleEnableSample}>
        <ShuffleIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SamplingButtons({ className, contentListState, dispatchContentListState }: Props) {
  const handleOrdered = useCallback(() => {
    dispatchContentListState(new ContentListStateActions.SetPaging({}, 'first-page'));
  }, [dispatchContentListState]);

  const handleChangeSeed = useCallback(() => {
    dispatchContentListState(new ContentListStateActions.SetSampling({ seed: undefined }, true));
  }, [dispatchContentListState]);

  return (
    <div className={className}>
      <SampleEntitiesOptionsCount {...{ contentListState, dispatchContentListState }} />
      <Button variant="outline" size="icon" onClick={handleChangeSeed}>
        <ShuffleIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleOrdered}>
        <ArrowDownNarrowWideIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

const items = [
  { id: '25', count: 25 },
  { id: '50', count: 50 },
  { id: '75', count: 75 },
  { id: '100', count: 100 },
];

function SampleEntitiesOptionsCount({
  contentListState,
  dispatchContentListState,
}: {
  contentListState: ContentListState;
  dispatchContentListState: Dispatch<ContentListStateAction>;
}) {
  const [open, setOpen] = useState(false);
  const { requestedCount } = contentListState;

  const currentPage =
    contentListState.entitySamples && contentListState.entitySamples.items.length > 0
      ? `${contentListState.entitySamples.items.length} of ${contentListState.entitySamples.totalCount}`
      : requestedCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost">{currentPage}</Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-[200px] flex-col gap-2 p-1">
        <p className="p-2 text-center text-sm font-semibold">Items per page</p>
        {items.map((it) => (
          <Button
            key={it.id}
            variant={it.count === requestedCount ? 'default' : 'ghost'}
            onClick={() => {
              dispatchContentListState(
                new ContentListStateActions.SetSampling({ count: it.count }, true),
              );
              setOpen(false);
            }}
          >
            {it.count}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
