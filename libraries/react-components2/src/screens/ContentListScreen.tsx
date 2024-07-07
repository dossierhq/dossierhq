'use client';

import { useReducer } from 'react';
import { ContentList } from '../components/ContentList.js';
import {
  ContentListCommandMenu,
  type ContentListCommandMenuConfig,
} from '../components/ContentListCommandMenu.js';
import { ContentListPagingButtons } from '../components/ContentListPagingButtons.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { initializeCommandMenuState, reduceCommandMenuState } from '../reducers/CommandReducer.js';
import { reduceContentListState } from '../reducers/ContentListReducer.js';
import {
  initializeContentListStateFromUrlQuery,
  useContentListCallOnUrlSearchQueryParamChange,
} from '../reducers/ContentListUrlSynchronizer.js';

export function ContentListScreen({
  urlSearchParams,
  onOpenEntity,
  onCreateEntity,
  onUrlSearchParamsChange,
}: {
  urlSearchParams?: Readonly<URLSearchParams> | null;
  onOpenEntity: (id: string) => void;
  onCreateEntity: (type: string) => void;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}) {
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    { mode: 'full', urlSearchParams },
    initializeContentListStateFromUrlQuery,
  );
  useContentListCallOnUrlSearchQueryParamChange('full', contentListState, onUrlSearchParamsChange);
  useLoadContentList(contentListState, dispatchContentList);

  const [commandMenuState, dispatchCommandMenu] = useReducer(
    reduceCommandMenuState<ContentListCommandMenuConfig>,
    { id: 'root' },
    initializeCommandMenuState<ContentListCommandMenuConfig>,
  );

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <ContentListCommandMenu
        state={commandMenuState}
        dispatch={dispatchCommandMenu}
        contentListState={contentListState}
        dispatchContentList={dispatchContentList}
        onOpenEntity={onOpenEntity}
        onCreateEntity={onCreateEntity}
      />
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
          dispatchContentList={dispatchContentList}
        />
      </main>
    </div>
  );
}
