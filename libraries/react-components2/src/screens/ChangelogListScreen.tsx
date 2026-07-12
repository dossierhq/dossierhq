'use client';

import type { Paging } from '@dossierhq/core';
import { useCallback, useEffect, useReducer, useRef, type JSX } from 'react';
import { ChangelogList } from '../components/ChangelogList.js';
import { ConnectionPagingButtons } from '../components/ConnectionPagingButtons.js';
import { ConnectionPagingCount } from '../components/ConnectionPagingCount.js';
import { useLoadChangelog } from '../hooks/useLoadChangelog.js';
import { ChangelogStateActions, reduceChangelogState } from '../reducers/ChangelogReducer.js';
import {
  initializeChangelogStateFromUrlQuery,
  useChangelogCallOnUrlSearchQueryParamChange,
} from '../reducers/ChangelogUrlSynchronizer.js';

export interface ChangelogListScreenProps {
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}

export function ChangelogListScreen({
  urlSearchParams,
  onUrlSearchParamsChange,
}: ChangelogListScreenProps): JSX.Element | null {
  const [changelogState, dispatchChangelog] = useReducer(
    reduceChangelogState,
    urlSearchParams,
    initializeChangelogStateFromUrlQuery,
  );

  useChangelogCallOnUrlSearchQueryParamChange(changelogState, onUrlSearchParamsChange);
  useLoadChangelog(changelogState, dispatchChangelog);

  const handlePagingChange = useCallback(
    (paging: Paging, pagingAction?: 'first-page' | 'prev-page' | 'next-page' | 'last-page') => {
      dispatchChangelog(new ChangelogStateActions.SetPaging(paging, pagingAction));
    },
    [dispatchChangelog],
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (changelogState.scrollToTopSignal > 0) {
      scrollContainerRef.current?.scrollTo({ top: 0 });
    }
  }, [changelogState.scrollToTopSignal]);

  const isEmpty = changelogState.edges?.length === 0;

  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <ChangelogList
          className={isEmpty ? 'container h-full p-2' : 'container min-h-full w-full p-2'}
          changelogState={changelogState}
          dispatchChangelog={dispatchChangelog}
        />
      </div>
      <div className="flex justify-center gap-2 border-t py-2">
        <ConnectionPagingButtons
          connection={changelogState.connection}
          pagingCount={changelogState.requestedCount}
          onPagingChange={handlePagingChange}
        />
        <ConnectionPagingCount
          connection={changelogState.connection}
          paging={changelogState.paging}
          pagingCount={changelogState.requestedCount}
          totalCount={changelogState.totalCount}
          onPagingChange={handlePagingChange}
        />
      </div>
    </div>
  );
}
