'use client';

import { useReducer } from 'react';
import { ContentListScreenLayout } from '../components/ContentListScreenLayout.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { useSchema } from '../hooks/useSchema.js';
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
  const { schema } = useSchema();
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    { mode: 'full', urlSearchParams },
    initializeContentListStateFromUrlQuery,
  );
  useContentListCallOnUrlSearchQueryParamChange('full', contentListState, onUrlSearchParamsChange);
  useLoadContentList(contentListState, dispatchContentList);

  return (
    <ContentListScreenLayout
      schema={schema}
      contentListState={contentListState}
      dispatchContentList={dispatchContentList}
      onOpenEntity={onOpenEntity}
      onCreateEntity={onCreateEntity}
    />
  );
}
