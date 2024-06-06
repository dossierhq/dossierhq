import { useReducer } from 'react';
import { ContentEditorLoader } from '../components/ContentEditorLoader';
import { EntityCard } from '../components/EntityCard';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext';
import { EntityEditorStateContext } from '../contexts/EntityEditorStateContext';
import {
  reduceEntityEditorState,
  type EntityEditorDraftState,
} from '../reducers/EntityEditorReducer';
import { initializeEditorEntityStateFromUrlQuery } from '../reducers/EntityEditorUrlSynchronizer';

export function ContentEditorScreen({
  urlSearchParams,
}: {
  urlSearchParams: Readonly<URLSearchParams> | undefined;
}) {
  const [entityEditorState, dispatchEntityEditorState] = useReducer(
    reduceEntityEditorState,
    urlSearchParams,
    initializeEditorEntityStateFromUrlQuery,
  );

  const { drafts } = entityEditorState;

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEntityEditorState}>
      <EntityEditorStateContext.Provider value={entityEditorState}>
        <ContentEditorLoader />
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
  return draftState.entity ? <EntityCard info={draftState.entity?.info} /> : 'new entity';
}
