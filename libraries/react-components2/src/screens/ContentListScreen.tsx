'use client';

import { useReducer } from 'react';
import { ContentList } from '../components/ContentList.js';
import { ContentListPagingButtons } from '../components/ContentListPagingButtons.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { reduceContentListState } from '../reducers/ContentListReducer.js';
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
  const [contentListState, dispatchContentListState] = useReducer(
    reduceContentListState,
    { mode: 'full', urlSearchParams },
    initializeContentListStateFromUrlQuery,
  );
  useContentListCallOnUrlSearchQueryParamChange('full', contentListState, onUrlSearchParamsChange);
  useLoadContentList(contentListState, dispatchContentListState);

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <main className="flex flex-grow flex-col">
        <div className="flex-1 overflow-auto">
          <ContentList
            className="container h-full w-full p-2"
            contentListState={contentListState}
            onItemClick={onOpenEntity}
          />
        </div>
        <ContentListPagingButtons
          className="border-t py-2"
          contentListState={contentListState}
          dispatchContentListState={dispatchContentListState}
        />
      </main>
    </div>
  );
}
