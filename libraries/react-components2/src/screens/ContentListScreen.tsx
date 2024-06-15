'use client';

import { useReducer } from 'react';
import { ContentListPagingButtons } from '../components/ContentListPagingButtons.js';
import { EntityCard } from '../components/EntityCard.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { cn } from '../lib/utils.js';
import { reduceContentListState, type ContentListState } from '../reducers/ContentListReducer.js';
import {
  initializeContentListStateFromUrlQuery,
  useContentListCallOnUrlSearchQueryParamChange,
} from '../reducers/ContentListUrlSynchronizer.js';

export function ContentListScreen({
  urlSearchParams,
  onOpenEntity,
  onUrlSearchParamsChange,
}: {
  urlSearchParams?: Readonly<URLSearchParams> | null;
  onOpenEntity: (id: string) => void;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}) {
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceContentListState,
    { mode: 'full', urlSearchParams },
    initializeContentListStateFromUrlQuery,
  );
  useContentListCallOnUrlSearchQueryParamChange('full', searchEntityState, onUrlSearchParamsChange);
  useLoadContentList(searchEntityState, dispatchSearchEntityState);

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <main className="flex flex-grow flex-col">
        <div className="flex-1 overflow-auto">
          <EntityList
            className="container h-full w-full p-2"
            searchEntityState={searchEntityState}
            onItemClick={onOpenEntity}
          />
        </div>
        <ContentListPagingButtons
          className="border-t py-2"
          contentListState={searchEntityState}
          dispatchContentListState={dispatchSearchEntityState}
        />
      </main>
    </div>
  );
}

function EntityList({
  className,
  searchEntityState,
  onItemClick,
}: {
  className?: string;
  searchEntityState: ContentListState;
  onItemClick?: (id: string) => void;
}) {
  return (
    <div className={cn(className, 'flex flex-col gap-2')}>
      {searchEntityState.entities?.map((item) => {
        if (item.isError()) {
          return null;
        }
        return (
          <EntityCard
            key={item.value.id}
            name={item.value.info.name}
            status={'status' in item.value.info ? item.value.info.status : undefined}
            type={item.value.info.type}
            updatedAt={'updatedAt' in item.value.info ? item.value.info.updatedAt : undefined}
            valid={item.value.info.valid}
            onClick={onItemClick ? () => onItemClick(item.value.id) : undefined}
          />
        );
      })}
    </div>
  );
}
