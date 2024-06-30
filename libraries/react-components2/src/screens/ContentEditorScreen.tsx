import { TerminalIcon } from 'lucide-react';
import { useContext, useEffect, useReducer, type Dispatch } from 'react';
import {
  ContentEditorCommandMenu,
  type ContentEditorCommandMenuAction,
  type ContentEditorCommandMenuConfig,
} from '../components/ContentEditorCommandMenu.js';
import { ContentEditorLoader } from '../components/ContentEditorLoader.js';
import { EntityEditor } from '../components/EntityEditor.js';
import { OpenContentDialogContent } from '../components/OpenContentDialogContent.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { Button } from '../components/ui/button.js';
import { Dialog } from '../components/ui/dialog.js';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext.js';
import { EntityEditorStateContext } from '../contexts/EntityEditorStateContext.js';
import { useResponsive } from '../hooks/useResponsive.js';
import {
  CommandMenuState_OpenPageAction,
  CommandMenuState_ShowAction,
  initializeCommandMenuState,
  reduceCommandMenuState,
} from '../reducers/CommandReducer.js';
import { reduceContentListState } from '../reducers/ContentListReducer.js';
import { initializeContentListStateFromUrlQuery } from '../reducers/ContentListUrlSynchronizer.js';
import { EntityEditorActions, reduceEntityEditorState } from '../reducers/EntityEditorReducer.js';
import {
  initializeEditorEntityStateFromUrlQuery,
  useEntityEditorCallOnUrlSearchQueryParamChange,
} from '../reducers/EntityEditorUrlSynchronizer.js';

export function ContentEditorScreen({
  urlSearchParams,
  onUrlSearchParamsChange,
  onEditorHasChangesChange,
}: {
  urlSearchParams?: Readonly<URLSearchParams> | null;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
  onEditorHasChangesChange: (hasChanges: boolean) => void;
}) {
  const [contentListState, dispatchContentListState] = useReducer(
    reduceContentListState,
    { mode: 'full', urlSearchParams },
    initializeContentListStateFromUrlQuery,
  );
  const [entityEditorState, dispatchEntityEditorState] = useReducer(
    reduceEntityEditorState,
    urlSearchParams ?? null,
    initializeEditorEntityStateFromUrlQuery,
  );
  useEntityEditorCallOnUrlSearchQueryParamChange(
    contentListState,
    entityEditorState,
    onUrlSearchParamsChange,
  );

  const [commandMenuState, dispatchCommandMenu] = useReducer(
    reduceCommandMenuState<ContentEditorCommandMenuConfig>,
    { id: 'root' },
    initializeCommandMenuState<ContentEditorCommandMenuConfig>,
  );

  useEffect(() => {
    onEditorHasChangesChange(entityEditorState.status === 'changed');
  }, [entityEditorState.status, onEditorHasChangesChange]);

  const { drafts, activeEntityEditorScrollSignal, activeEntityId } = entityEditorState;

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
    <EntityEditorDispatchContext.Provider value={dispatchEntityEditorState}>
      <EntityEditorStateContext.Provider value={entityEditorState}>
        <ContentEditorLoader />
        <ContentEditorCommandMenu state={commandMenuState} dispatch={dispatchCommandMenu} />
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
        {entityEditorState.showOpenDialog && (
          <Dialog
            open
            onOpenChange={() =>
              dispatchEntityEditorState(new EntityEditorActions.ToggleShowOpenDialog(false))
            }
          >
            <OpenContentDialogContent
              contentListState={contentListState}
              dispatchContentListState={dispatchContentListState}
              onOpenEntity={(entityId) => {
                dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: entityId }));
                dispatchEntityEditorState(new EntityEditorActions.ToggleShowOpenDialog(false));
              }}
            />
          </Dialog>
        )}
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}

function Sidebar({
  dispatchCommandMenu,
}: {
  dispatchCommandMenu: Dispatch<ContentEditorCommandMenuAction>;
}) {
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
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
          onClick={() =>
            dispatchEntityEditorState(new EntityEditorActions.ToggleShowOpenDialog(true))
          }
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
        {/* <Button variant="outline" size="icon">
          <ChevronLeft className="h-[1.2rem] w-[1.2rem]" />
        </Button> */}
      </div>
    </aside>
  );
}

function OpenEntityList() {
  const entityEditorState = useContext(EntityEditorStateContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  return entityEditorState.drafts.map((entityDraft) => {
    if (!entityDraft.draft) return null;
    return (
      <button
        key={entityDraft.id}
        className="rounded border bg-background p-2 text-start hover:bg-accent"
        onClick={() =>
          dispatchEntityEditorState(
            new EntityEditorActions.SetActiveEntity(entityDraft.id, false, true),
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
  return (
    <div className="flex items-center border-b">
      <div className="container flex gap-2 p-2">
        <Button
          variant="outline"
          onClick={() => dispatchCommandMenu(new CommandMenuState_ShowAction([{ id: 'root' }]))}
        >
          <TerminalIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <div className="flex flex-grow justify-end gap-2">
          {/* <Button variant="secondary">Open</Button> */}
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
