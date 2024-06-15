import { useEffect, useReducer } from 'react';
import {
  ContentEditorCommandMenu,
  type ContentEditorCommandMenuPage,
} from '../components/ContentEditorCommandMenu.js';
import { ContentEditorLoader } from '../components/ContentEditorLoader.js';
import { EntityEditor } from '../components/EntityEditor.js';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext.js';
import { EntityEditorStateContext } from '../contexts/EntityEditorStateContext.js';
import { initializeCommandMenuState, reduceCommandMenuState } from '../reducers/CommandReducer.js';
import { reduceEntityEditorState } from '../reducers/EntityEditorReducer.js';
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
  const [entityEditorState, dispatchEntityEditorState] = useReducer(
    reduceEntityEditorState,
    urlSearchParams ?? null,
    initializeEditorEntityStateFromUrlQuery,
  );
  useEntityEditorCallOnUrlSearchQueryParamChange(entityEditorState, onUrlSearchParamsChange);

  const [commandMenuState, dispatchCommandMenu] = useReducer(
    reduceCommandMenuState<ContentEditorCommandMenuPage>,
    { id: 'root' },
    initializeCommandMenuState<ContentEditorCommandMenuPage>,
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
      element.scrollIntoView();
    }
  }, [entityEditorAndSignal]);

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEntityEditorState}>
      <EntityEditorStateContext.Provider value={entityEditorState}>
        <ContentEditorLoader />
        <ContentEditorCommandMenu state={commandMenuState} dispatch={dispatchCommandMenu} />
        <div className="flex h-dvh w-dvw overflow-hidden">
          <main className="flex flex-grow flex-col">
            <div className="overflow-auto">
              <div className="container flex flex-col gap-2 p-2">
                {drafts.map((it) => (
                  <EntityEditor key={it.id} id={`entity-${it.id}-editor`} draftState={it} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}
