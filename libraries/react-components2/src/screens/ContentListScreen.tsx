'use client';

import { EntityQueryOrder } from '@dossierhq/core';
import { ArrowDownNarrowWideIcon, ArrowDownWideNarrowIcon, TerminalIcon } from 'lucide-react';
import { useReducer, useState, type Dispatch, type SetStateAction } from 'react';
import { ContentList } from '../components/ContentList.js';
import {
  ContentListCommandMenu,
  type ContentListCommandMenuAction,
  type ContentListCommandMenuConfig,
} from '../components/ContentListCommandMenu.js';
import { ContentListPagingButtons } from '../components/ContentListPagingButtons.js';
import { ContentListSearchSearchInput } from '../components/ContentListSearchInput.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { Button } from '../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { useResponsive } from '../hooks/useResponsive.js';
import { cn } from '../lib/utils.js';
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

type ViewMode = 'list' | 'split' | 'map';

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

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [commandMenuState, dispatchCommandMenu] = useReducer(
    reduceCommandMenuState<ContentListCommandMenuConfig>,
    { id: 'root' },
    initializeCommandMenuState<ContentListCommandMenuConfig>,
  );

  const md = useResponsive('md');
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
      {md && (
        <Sidebar
          viewMode={viewMode}
          setViewMode={setViewMode}
          dispatchCommandMenu={dispatchCommandMenu}
        />
      )}
      <main className="flex flex-grow flex-col">
        <Toolbar
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
          dispatchCommandMenu={dispatchCommandMenu}
        />
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

function Sidebar({
  viewMode: _1,
  setViewMode: _2,
  dispatchCommandMenu,
}: {
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  dispatchCommandMenu: Dispatch<ContentListCommandMenuAction>;
}) {
  return (
    <aside className="flex w-1/5 min-w-72 max-w-80 flex-col border-r">
      <div className="mt-2 flex gap-2 px-2">
        <Button
          variant="outline"
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'root' }]))}
        >
          <TerminalIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <Button
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'create' }]))}
        >
          Create
        </Button>
      </div>
      <div className="flex flex-grow flex-col gap-2 overflow-auto p-2"></div>
      <div className="flex justify-between border-t px-2 py-1">
        <ThemeToggle />
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
        <Button
          className="md:hidden"
          variant="outline"
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'root' }]))}
        >
          <TerminalIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <ContentListSearchSearchInput
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
        <OrderDropdown
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

function OrderDropdown({
  className,
  contentListState,
  dispatchContentList,
}: {
  className?: string;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}) {
  const currentOrder = contentListState.query.order ?? EntityQueryOrder.updatedAt;
  const currentReverse = contentListState.query.reverse ?? false;
  const fieldDisplay = {
    name: 'Name',
    createdAt: 'Created',
    updatedAt: 'Updated',
  }[currentOrder];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn(className, 'min-w-32')} variant="outline">
          {currentReverse ? (
            <ArrowDownWideNarrowIcon className="mr-2 h-4 w-4" />
          ) : (
            <ArrowDownNarrowWideIcon className="mr-2 h-4 w-4" />
          )}
          {fieldDisplay}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-28" align="end">
        <DropdownMenuLabel>Sort order</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={currentOrder}
          onValueChange={(value) => {
            let newReverse = false;
            if (value === currentOrder) {
              newReverse = !currentReverse;
            } else if (
              value === EntityQueryOrder.updatedAt ||
              value === EntityQueryOrder.createdAt
            ) {
              // Default to descending order for dates
              newReverse = true;
            }
            dispatchContentList(
              new ContentListStateActions.SetQuery(
                { order: value as EntityQueryOrder, reverse: newReverse },
                { partial: true, resetPagingIfModifying: true },
              ),
            );
          }}
        >
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="createdAt">Created</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updatedAt">Updated</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
