import type { Dispatch } from 'react';
import React from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';
import { EntityEditorNew, EntityMetadata } from '../..';

export interface EntityEditorContainerProps {
  editorState: EntityEditorState;
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditorContainer({
  editorState,
  dispatchEditorState,
}: EntityEditorContainerProps): JSX.Element {
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
