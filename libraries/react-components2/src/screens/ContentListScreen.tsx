'use client';

import type { Schema } from '@dossierhq/core';
import { useReducer, type Dispatch } from 'react';
import {
  ContentListCommandMenu,
  type ContentListCommandMenuAction,
  type ContentListCommandMenuConfig,
} from '../components/ContentListCommandMenu.js';
import { ContentListSearchSearchInput } from '../components/ContentListSearchInput.js';
import { ContentListSplitOrMapContainer } from '../components/ContentListSplitOrMapContainer.js';
import { ContentListViewModeToggle } from '../components/ContentListViewModeToggle.js';
import { ContentTypesSelector } from '../components/ContentTypesSelector.js';
import { EntityQueryOrderDropdownMenu } from '../components/EntityQueryOrderDropdownMenu.js';
import { EntityStatusSelector } from '../components/EntityStatusSelector.js';
import { ShowCommandMenuButton } from '../components/ShowCommandMenuButton.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { Button } from '../components/ui/button.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { useResponsive } from '../hooks/useResponsive.js';
import { useSchema } from '../hooks/useSchema.js';
import {
  CommandMenuState_ShowAction,
  initializeCommandMenuState,
  reduceCommandMenuState,
} from '../reducers/CommandReducer.js';
import {
  ContentListStateActions,
  reduceContentListState,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
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

  const [commandMenuState, dispatchCommandMenu] = useReducer(
    reduceCommandMenuState<ContentListCommandMenuConfig>,
    { id: 'root' },
    initializeCommandMenuState<ContentListCommandMenuConfig>,
  );

  const md = useResponsive('md');
  const lg = useResponsive('lg');
  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <ContentListCommandMenu
        state={commandMenuState}
        dispatch={dispatchCommandMenu}
        contentListState={contentListState}
        dispatchContentList={dispatchContentList}
        onCreateEntity={onCreateEntity}
      />
      {md && (
        <Sidebar
          schema={schema}
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
          dispatchCommandMenu={dispatchCommandMenu}
        />
      )}
      <main className="flex grow flex-col">
        <Toolbar
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
          dispatchCommandMenu={dispatchCommandMenu}
        />
        <ContentListSplitOrMapContainer
          schema={schema}
          lg={lg}
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
          onOpenEntity={onOpenEntity}
        />
      </main>
    </div>
  );
}

function Sidebar({
  schema,
  contentListState,
  dispatchContentList,
  dispatchCommandMenu,
}: {
  schema: Schema | undefined;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  dispatchCommandMenu: Dispatch<ContentListCommandMenuAction>;
}) {
  return (
    <aside className="flex w-1/5 max-w-80 min-w-72 flex-col border-r">
      <div className="mt-2 flex gap-2 px-2">
        <ShowCommandMenuButton dispatchCommandMenu={dispatchCommandMenu} />
        <Button
          variant="secondary"
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'create' }]))}
        >
          Create
        </Button>
      </div>
      <div className="flex grow flex-col gap-2 overflow-auto p-2">
        <p className="text-sm font-semibold">Filters</p>
        <EntityStatusSelector
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
        <ContentTypesSelector
          schema={schema}
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
        {(contentListState.query.authKeys ||
          contentListState.query.componentTypes ||
          contentListState.query.entityTypes ||
          'status' in contentListState.query) && (
          <Button
            className="self-start"
            variant="ghost"
            onClick={() => {
              dispatchContentList(
                new ContentListStateActions.SetQuery(
                  { text: contentListState.text },
                  { partial: false, resetPagingIfModifying: true },
                ),
              );
            }}
          >
            Clear all filters
          </Button>
        )}
      </div>
      <div className="flex justify-between border-t px-2 py-1">
        <ThemeToggle />
        <ContentListViewModeToggle
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
      </div>
    </aside>
  );
}

function Toolbar({
  contentListState,
  dispatchContentList,
  dispatchCommandMenu,
}: {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  dispatchCommandMenu: Dispatch<ContentListCommandMenuAction>;
}) {
  return (
    <div className="flex items-center border-b">
      <div className="container flex gap-2 p-2">
        <ShowCommandMenuButton className="md:hidden" dispatchCommandMenu={dispatchCommandMenu} />
        <ContentListSearchSearchInput
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
        <EntityQueryOrderDropdownMenu
          className="hidden md:inline-flex"
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
        <Button
          className="md:hidden"
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'create' }]))}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
