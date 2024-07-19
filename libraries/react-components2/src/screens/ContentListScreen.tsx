'use client';

import { EntityQueryOrder, type EntityStatus, type Schema } from '@dossierhq/core';
import {
  ArrowDownNarrowWideIcon,
  ArrowDownWideNarrowIcon,
  Columns2Icon,
  ListIcon,
  MapIcon,
  Rows2Icon,
  TerminalIcon,
} from 'lucide-react';
import { lazy, Suspense, useReducer, useState, type Dispatch } from 'react';
import { ContentList } from '../components/ContentList.js';
import {
  ContentListCommandMenu,
  type ContentListCommandMenuAction,
  type ContentListCommandMenuConfig,
} from '../components/ContentListCommandMenu.js';
import { ContentListPagingButtons } from '../components/ContentListPagingButtons.js';
import { ContentListSearchSearchInput } from '../components/ContentListSearchInput.js';
import { ContentTypesSelector } from '../components/ContentTypesSelector.js';
import { EntityDisplay } from '../components/EntityDisplay.js';
import { MultiCombobox } from '../components/MultiCombobox.js';
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../components/ui/resizable.js';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { useResponsive } from '../hooks/useResponsive.js';
import { useSchema } from '../hooks/useSchema.js';
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
  type ContentListViewMode,
} from '../reducers/ContentListReducer.js';
import {
  initializeContentListStateFromUrlQuery,
  useContentListCallOnUrlSearchQueryParamChange,
} from '../reducers/ContentListUrlSynchronizer.js';

const ContentMap = lazy(() =>
  import('../components/ContentMap.js').then((it) => ({ default: it.ContentMap })),
);
const ContentMapMarker = lazy(() =>
  import('../components/ContentMapMarker.js').then((it) => ({ default: it.ContentMapMarker })),
);

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

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [commandMenuState, dispatchCommandMenu] = useReducer(
    reduceCommandMenuState<ContentListCommandMenuConfig>,
    { id: 'root' },
    initializeCommandMenuState<ContentListCommandMenuConfig>,
  );

  const showDate =
    contentListState.query.order === EntityQueryOrder.createdAt ? 'createdAt' : 'updatedAt';

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
      <main className="flex flex-grow flex-col">
        <Toolbar
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
          dispatchCommandMenu={dispatchCommandMenu}
        />
        {contentListState.viewMode === 'list' && (
          <>
            <div className="flex-1 overflow-auto">
              <ContentList
                className="container min-h-full w-full p-2"
                contentListState={contentListState}
                showDate={showDate}
                onItemClick={onOpenEntity}
              />
            </div>
            <ContentListPagingButtons
              className="border-t py-2"
              contentListState={contentListState}
              dispatchContentList={dispatchContentList}
            />
          </>
        )}
        {(contentListState.viewMode === 'split' || contentListState.viewMode === 'map') && (
          <ResizablePanelGroup direction={lg ? 'horizontal' : 'vertical'}>
            <ResizablePanel minSize={20}>
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-auto">
                  <ContentList
                    className="min-h-full w-full p-2"
                    contentListState={contentListState}
                    selectedItem={contentListState.viewMode === 'split' ? selectedEntityId : null}
                    onItemClick={
                      contentListState.viewMode === 'split' ? setSelectedEntityId : onOpenEntity
                    }
                    showDate={showDate}
                  />
                  {!lg && (
                    <ContentListPagingButtons
                      className="border-t py-2"
                      contentListState={contentListState}
                      dispatchContentList={dispatchContentList}
                    />
                  )}
                </div>
                {lg && (
                  <ContentListPagingButtons
                    className="border-t py-2"
                    contentListState={contentListState}
                    dispatchContentList={dispatchContentList}
                  />
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel minSize={20}>
              {contentListState.viewMode === 'split' &&
                ((contentListState.entities && contentListState.entities.length > 0) ||
                  selectedEntityId) && (
                  <EntityDisplay
                    className="h-full w-full overflow-auto p-2"
                    entityId={selectedEntityId}
                  />
                )}
              {contentListState.viewMode === 'map' && !!schema ? (
                <Suspense>
                  <ContentMap
                    className="h-full"
                    schema={schema}
                    contentListState={contentListState}
                    dispatchContentList={dispatchContentList}
                    renderEntityMarker={(key, entity, location) => (
                      <ContentMapMarker
                        key={key}
                        entity={entity}
                        location={location}
                        onClick={() => onOpenEntity(entity.id)}
                      />
                    )}
                  />
                </Suspense>
              ) : null}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
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
    <aside className="flex w-1/5 min-w-72 max-w-80 flex-col border-r">
      <div className="mt-2 flex gap-2 px-2">
        <Button
          variant="outline"
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'root' }]))}
        >
          <TerminalIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <Button
          variant="secondary"
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'create' }]))}
        >
          Create
        </Button>
      </div>
      <div className="flex flex-grow flex-col gap-2 overflow-auto p-2">
        <p className="text-sm font-semibold">Filters</p>
        <MultiCombobox<{ value: EntityStatus; label: string }>
          items={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'modified', label: 'Modified' },
            { value: 'withdrawn', label: 'Withdrawn' },
            { value: 'archived', label: 'Archived' },
          ]}
          selected={(contentListState as ContentListState<'full'>).query.status ?? []}
          placeholder="Status"
          onSelect={(status) =>
            dispatchContentList(
              new ContentListStateActions.SetQuery(
                {
                  status: [
                    ...((contentListState as ContentListState<'full'>).query.status ?? []),
                    status,
                  ],
                },
                { partial: true, resetPagingIfModifying: true },
              ),
            )
          }
          onUnselect={(status) =>
            dispatchContentList(
              new ContentListStateActions.SetQuery(
                {
                  status: (
                    (contentListState as ContentListState<'full'>).query.status ?? []
                  ).filter((it) => it !== status),
                },
                { partial: true, resetPagingIfModifying: true },
              ),
            )
          }
        />
        <ContentTypesSelector
          schema={schema}
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
      </div>
      <div className="flex justify-between border-t px-2 py-1">
        <ThemeToggle />
        <ViewModeToggle
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

function ViewModeToggle({
  contentListState,
  dispatchContentList,
}: {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}) {
  return (
    <ToggleGroup
      className="bg-background"
      value={contentListState.viewMode}
      type="single"
      onValueChange={(value) => {
        if (value) {
          dispatchContentList(
            new ContentListStateActions.SetViewMode(value as ContentListViewMode),
          );
        }
      }}
    >
      <ToggleGroupItem value="list" title="View list">
        <ListIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="split" title="View split">
        <Columns2Icon className="hidden h-4 w-4 lg:block" />
        <Rows2Icon className="h-4 w-4 lg:hidden" />
      </ToggleGroupItem>
      <ToggleGroupItem value="map" title="View map">
        <MapIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
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
        <Button className={cn(className, 'min-w-32')} variant="outline" title="Change sort order">
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
