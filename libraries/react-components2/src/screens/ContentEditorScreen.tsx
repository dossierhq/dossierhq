import { useReducer } from 'react';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext';
import { EntityEditorStateContext } from '../contexts/EntityEditorStateContext';
import {
  initializeEntityEditorState,
  reduceEntityEditorState,
  type EntityEditorDraftState,
} from '../reducers/EntityEditorReducer';

export function ContentEditorScreen() {
  const [entityEditorState, dispatchEntityEditorState] = useReducer(
    reduceEntityEditorState,
    undefined,
    initializeEntityEditorState, //TODO initialize with urlSearchParams
  );

  const { drafts } = entityEditorState;

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEntityEditorState}>
      <EntityEditorStateContext.Provider value={entityEditorState}>
        <div className="flex h-dvh w-dvw overflow-hidden">
          <main className="flex flex-grow flex-col">
            <div className="overflow-auto">
              <div className="container flex flex-col gap-2 p-2">
                {drafts.map((it) => (
                  <EntityEditor key={it.id} draftState={it} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}

function EntityEditor({ draftState }: { draftState: EntityEditorDraftState }) {
  return draftState.id;
}
