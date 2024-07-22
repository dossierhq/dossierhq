import type { Schema } from '@dossierhq/core';
import type { Dispatch } from 'react';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { useResponsive } from '../hooks/useResponsive.js';
import { useSchema } from '../hooks/useSchema.js';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { ContentListSearchSearchInput } from './ContentListSearchInput.js';
import { ContentListSplitOrMapContainer } from './ContentListSplitOrMapContainer.js';
import { ContentListViewModeToggle } from './ContentListViewModeToggle.js';
import { ContentTypesSelector } from './ContentTypesSelector.js';
import { EntityQueryOrderDropdownMenu } from './EntityQueryOrderDropdownMenu.js';
import { EntityStatusSelector } from './EntityStatusSelector.js';
import { ThemeToggle } from './ThemeToggle.js';
import { Button } from './ui/button.js';
import { DialogContent, DialogHeader, DialogTitle } from './ui/dialog.js';

interface Props {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  onOpenEntity: (entityId: string) => void;
  onCreateEntity: () => void;
}

export function OpenContentDialogContent({
  contentListState,
  dispatchContentList,
  onOpenEntity,
  onCreateEntity,
}: Props) {
  const { schema } = useSchema();
  useLoadContentList(contentListState, dispatchContentList);
  const md = useResponsive('md');
  const lg = useResponsive('lg');
  return (
    <DialogContent className="grid-rows-[auto_1fr]" size="maximize">
      <DialogHeader>
        <DialogTitle>Select content</DialogTitle>
      </DialogHeader>
      <div className="-m-6 mt-0 flex overflow-hidden">
        {md && (
          <Sidebar
            schema={schema}
            contentListState={contentListState}
            dispatchContentList={dispatchContentList}
            onCreateEntity={onCreateEntity}
          />
        )}
        <main className="flex flex-grow flex-col">
          <Toolbar
            contentListState={contentListState}
            dispatchContentList={dispatchContentList}
            onCreateEntity={onCreateEntity}
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
    </DialogContent>
  );
}

function Sidebar({
  schema,
  contentListState,
  dispatchContentList,
  onCreateEntity,
}: {
  schema: Schema | undefined;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  onCreateEntity: () => void;
}) {
  return (
    <aside className="flex w-1/5 min-w-72 max-w-80 flex-col border-r">
      <div className="mt-2 flex gap-2 px-2">
        <Button variant="secondary" onClick={onCreateEntity}>
          Create
        </Button>
      </div>
      <div className="flex flex-grow flex-col gap-2 overflow-auto p-2">
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
  onCreateEntity,
}: {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  onCreateEntity: () => void;
}) {
  return (
    <div className="flex items-center border-b">
      <div className="container flex gap-2 p-2">
        <ContentListSearchSearchInput
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
        <EntityQueryOrderDropdownMenu
          className="hidden md:inline-flex"
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
        <Button className="md:hidden" onClick={onCreateEntity}>
          Create
        </Button>
      </div>
    </div>
  );
}
