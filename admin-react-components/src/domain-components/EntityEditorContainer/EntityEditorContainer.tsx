import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';
import { EntityEditor, EntityMetadata } from '../..';
import { TypePicker } from '../TypePicker/TypePicker';
import { AddEntityDraftAction } from '../EntityEditor/EntityEditorReducer';

export interface EntityEditorContainerProps {
  editorState: EntityEditorState;
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditorContainer({
  editorState,
  dispatchEditorState,
}: EntityEditorContainerProps): JSX.Element {
  const handleCreateEntity = useCallback(
    (type: string) => dispatchEditorState(new AddEntityDraftAction({ newType: type })),
    [dispatchEditorState]
  );
  return (
    <>
      {editorState.drafts.map((draftState) => (
        <div key={draftState.id} style={{ display: 'flex' }}>
          <EntityEditor
            entityId={draftState.id}
            {...{ editorState, dispatchEditorState }}
            style={{ flexGrow: 1 }}
          />
          <EntityMetadata entityId={draftState.id} />
        </div>
      ))}
      <TypePicker
        id="create-entity-picker"
        text="Create entity"
        showEntityTypes
        onTypeSelected={handleCreateEntity}
      />
    </>
  );
}
