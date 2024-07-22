import { useContext, useEffect, useReducer, type Dispatch } from 'react';
import {
  ContentEditorCommandMenu,
  type ContentEditorCommandMenuAction,
  type ContentEditorCommandMenuConfig,
} from '../components/ContentEditorCommandMenu.js';
import { ContentEditorLoader } from '../components/ContentEditorLoader.js';
import { EntityEditor } from '../components/EntityEditor.js';
import { OpenContentDialogContent } from '../components/OpenContentDialogContent.js';
import { ShowCommandMenuButton } from '../components/ShowCommandMenuButton.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { Button } from '../components/ui/button.js';
import { Dialog } from '../components/ui/dialog.js';
import { Toaster } from '../components/ui/sonner.js';
import { ContentEditorDispatchContext } from '../contexts/ContentEditorDispatchContext.js';
import { ContentEditorStateContext } from '../contexts/ContentEditorStateContext.js';
import { useResponsive } from '../hooks/useResponsive.js';
import {
  CommandMenuState_OpenPageAction,
  initializeCommandMenuState,
  reduceCommandMenuState,
} from '../reducers/CommandReducer.js';
import {
  ContentEditorActions,
  reduceContentEditorState,
} from '../reducers/ContentEditorReducer.js';
import {
  initializeContentEntityStateFromUrlQuery,
  useContentEditorCallOnUrlSearchQueryParamChange,
} from '../reducers/ContentEditorUrlSynchronizer.js';
import { reduceContentListState } from '../reducers/ContentListReducer.js';
import { initializeContentListStateFromUrlQuery } from '../reducers/ContentListUrlSynchronizer.js';

export function ContentEditorScreen({
  urlSearchParams,
  onUrlSearchParamsChange,
  onEditorHasChangesChange,
}: {
  urlSearchParams?: Readonly<URLSearchParams> | null;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
  onEditorHasChangesChange: (hasChanges: boolean) => void;
}) {
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    { mode: 'full', urlSearchParams },
    initializeContentListStateFromUrlQuery,
  );
  const [contentEditorState, dispatchContentEditor] = useReducer(
    reduceContentEditorState,
    urlSearchParams ?? null,
    initializeContentEntityStateFromUrlQuery,
  );
  useContentEditorCallOnUrlSearchQueryParamChange(
    contentListState,
    contentEditorState,
    onUrlSearchParamsChange,
  );

  const [commandMenuState, dispatchCommandMenu] = useReducer(
    reduceCommandMenuState<ContentEditorCommandMenuConfig>,
    { id: 'root' },
    initializeCommandMenuState<ContentEditorCommandMenuConfig>,
  );

  useEffect(() => {
    onEditorHasChangesChange(contentEditorState.status === 'changed');
  }, [contentEditorState.status, onEditorHasChangesChange]);

  const { drafts, activeEntityEditorScrollSignal, activeEntityId } = contentEditorState;

  const entityEditorAndSignal = activeEntityId
    ? `${activeEntityId} ${activeEntityEditorScrollSignal}`
    : null;
  useEffect(() => {
    if (!entityEditorAndSignal) return;
    const [entityId, _signal] = entityEditorAndSignal.split(' ');
    const element = document.getElementById(`entity-${entityId}-editor`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [entityEditorAndSignal]);

  const md = useResponsive('md');
  return (
    <ContentEditorDispatchContext.Provider value={dispatchContentEditor}>
      <ContentEditorStateContext.Provider value={contentEditorState}>
        <ContentEditorLoader />
        <ContentEditorCommandMenu
          disabled={contentEditorState.showOpenDialog}
          state={commandMenuState}
          dispatch={dispatchCommandMenu}
        />
        <Toaster />
        <div className="flex h-dvh w-dvw overflow-hidden">
          {md && <Sidebar dispatchCommandMenu={dispatchCommandMenu} />}
          <main className="flex flex-grow flex-col">
            {!md && <Toolbar dispatchCommandMenu={dispatchCommandMenu} />}
            <div className="overflow-auto">
              <div className="container flex flex-col gap-2 p-2">
                {drafts.map((it) => (
                  <EntityEditor
                    key={it.id}
                    id={`entity-${it.id}-editor`}
                    draftState={it}
                    dispatchCommandMenu={dispatchCommandMenu}
                  />
                ))}
              </div>
            </div>
          </main>
        </div>
        {contentEditorState.showOpenDialog && (
          <Dialog
            open
            onOpenChange={() =>
              dispatchContentEditor(new ContentEditorActions.ToggleShowOpenDialog(false))
            }
          >
            <OpenContentDialogContent
              contentListState={contentListState}
              dispatchContentList={dispatchContentList}
              onOpenEntity={(entityId) => {
                dispatchContentEditor(new ContentEditorActions.AddDraft({ id: entityId }));
                dispatchContentEditor(new ContentEditorActions.ToggleShowOpenDialog(false));
              }}
              onCreateEntity={(type: string) => {
                dispatchContentEditor(
                  new ContentEditorActions.AddDraft({ id: crypto.randomUUID(), newType: type }),
                );
                dispatchContentEditor(new ContentEditorActions.ToggleShowOpenDialog(false));
              }}
            />
          </Dialog>
        )}
      </ContentEditorStateContext.Provider>
    </ContentEditorDispatchContext.Provider>
  );
}

function Sidebar({
  dispatchCommandMenu,
}: {
  dispatchCommandMenu: Dispatch<ContentEditorCommandMenuAction>;
}) {
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  return (
    <aside className="flex w-1/5 min-w-72 max-w-80 flex-col border-r">
      <div className="mt-2 flex gap-2 px-2">
        <ShowCommandMenuButton dispatchCommandMenu={dispatchCommandMenu} />
        <Button
          variant="secondary"
          onClick={() => dispatchContentEditor(new ContentEditorActions.ToggleShowOpenDialog(true))}
        >
          Open
        </Button>
        <Button
          variant="secondary"
          onClick={() => dispatchCommandMenu(new CommandMenuState_OpenPageAction({ id: 'create' }))}
        >
          Create
        </Button>
      </div>
      <div className="flex flex-grow flex-col gap-2 overflow-auto p-2">
        <OpenEntityList />
      </div>
      <div className="flex justify-between border-t px-2 py-1">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function OpenEntityList() {
  const contentEditorState = useContext(ContentEditorStateContext);
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  return contentEditorState.drafts.map((entityDraft) => {
    if (!entityDraft.draft) return null;
    return (
      <button
        key={entityDraft.id}
        className="rounded border bg-background p-2 text-start hover:bg-accent"
        onClick={() =>
          dispatchContentEditor(
            new ContentEditorActions.SetActiveEntity(entityDraft.id, false, true),
          )
        }
      >
        <div className="flex items-baseline gap-2">
          <p className="w-0 flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
            {entityDraft.draft.entitySpec.name}
          </p>
          {entityDraft.status === 'changed' && (
            <span className="inline-block h-3 w-3 rounded-full bg-foreground" />
          )}
        </div>
        <p className="overflow-hidden text-ellipsis whitespace-nowrap">{entityDraft.draft.name}</p>
      </button>
    );
  });
}

function Toolbar({
  dispatchCommandMenu,
}: {
  dispatchCommandMenu: Dispatch<ContentEditorCommandMenuAction>;
}) {
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  return (
    <div className="flex items-center border-b">
      <div className="container flex gap-2 p-2">
        <ShowCommandMenuButton dispatchCommandMenu={dispatchCommandMenu} />
        <div className="flex flex-grow justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              dispatchContentEditor(new ContentEditorActions.ToggleShowOpenDialog(true))
            }
          >
            Open
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              dispatchCommandMenu(new CommandMenuState_OpenPageAction({ id: 'create' }))
            }
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
