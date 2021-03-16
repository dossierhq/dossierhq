import React, { useContext, useEffect, useReducer } from 'react';
import { DataDataContext, EntityEditorNew, EntityMetadata, Loader } from '../..';
import type { DataDataContextValue, EntityEditorSelector } from '../..';
import {
  AddDraftAction,
  initializeEditorState,
  reduceEditorState,
} from '../EntityEditor/EntityEditorReducer';

export interface EntityEditorContainerProps {
  entitySelector: EntityEditorSelector;
}

interface EntityEditorContainerInnerProps extends EntityEditorContainerProps {
  contextValue: DataDataContextValue;
}

export function EntityEditorContainer({ entitySelector }: EntityEditorContainerProps): JSX.Element {
  const contextValue = useContext(DataDataContext);
  if (!contextValue) {
    return <Loader />;
  }

  return <EntityEditorContainerInner {...{ entitySelector, contextValue }} />;
}

function EntityEditorContainerInner({
  entitySelector,
  contextValue,
}: EntityEditorContainerInnerProps): JSX.Element {
  const [editorState, dispatchEditorState] = useReducer(
    reduceEditorState,
    { schema: contextValue.schema },
    initializeEditorState
  );
  useEffect(() => dispatchEditorState(new AddDraftAction(entitySelector)), [entitySelector]);
  return (
    <>
      {editorState.drafts.map((draftState) => (
        <div key={draftState.id} style={{ display: 'flex' }}>
          <EntityEditorNew
            entityId={draftState.id}
            {...{ editorState, dispatchEditorState }}
            style={{ flexGrow: 1 }}
          />
          <EntityMetadata entityId={draftState.id} />
        </div>
      ))}
    </>
  );
}
