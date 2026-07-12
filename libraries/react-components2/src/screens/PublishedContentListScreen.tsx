'use client';

import { useReducer } from 'react';
import { ContentListScreenLayout } from '../components/ContentListScreenLayout.js';
import { DisplayModeContext } from '../contexts/DisplayModeContext.js';
import { usePublishedLoadContentList } from '../hooks/usePublishedLoadContentList.js';
import { usePublishedSchema } from '../hooks/usePublishedSchema.js';
import { reduceContentListState } from '../reducers/ContentListReducer.js';
import {
  initializeContentListStateFromUrlQuery,
  useContentListCallOnUrlSearchQueryParamChange,
} from '../reducers/ContentListUrlSynchronizer.js';

export function PublishedContentListScreen({
  urlSearchParams,
  onOpenEntity,
  onUrlSearchParamsChange,
}: {
  urlSearchParams?: Readonly<URLSearchParams> | null;
  onOpenEntity: (id: string) => void;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}) {
  const { schema } = usePublishedSchema();
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    { mode: 'published', urlSearchParams },
    initializeContentListStateFromUrlQuery,
  );
  useContentListCallOnUrlSearchQueryParamChange(
    'published',
    contentListState,
    onUrlSearchParamsChange,
  );
  usePublishedLoadContentList(contentListState, dispatchContentList);

  return (
    <DisplayModeContext.Provider value="published">
      <ContentListScreenLayout
        schema={schema}
        contentListState={contentListState}
        dispatchContentList={dispatchContentList}
        onOpenEntity={onOpenEntity}
      />
    </DisplayModeContext.Provider>
  );
}
