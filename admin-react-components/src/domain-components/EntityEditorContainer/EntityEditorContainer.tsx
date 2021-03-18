import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';
import { EntityEditor, EntityMetadata } from '../..';
import { TypePicker } from '../TypePicker/TypePicker';
import { AddEntityDraftAction, SetActiveEntityAction } from '../EntityEditor/EntityEditorReducer';
import { useWindowEventListener } from '../../utils/EventUtils';

export interface EntityEditorContainerProps {
  editorState: EntityEditorState;
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditorContainer({
  editorState,
  dispatchEditorState,
}: EntityEditorContainerProps): JSX.Element {
  useEntityEditorFocused(editorState, dispatchEditorState);
  const handleCreateEntity = useCallback(
    (type: string) => dispatchEditorState(new AddEntityDraftAction({ newType: type })),
    [dispatchEditorState]
  );

  const { activeEntityId } = editorState;

  return (
    <>
      {editorState.drafts.map((draftState) => (
        <div key={draftState.id} style={{ display: 'flex' }}>
          <EntityEditor
            entityId={draftState.id}
            {...{ editorState, dispatchEditorState }}
            style={{ flexGrow: 1 }}
          />
          {activeEntityId === draftState.id ? <EntityMetadata entityId={draftState.id} /> : null}
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

function useEntityEditorFocused(
  editorState: EntityEditorState,
  dispatchEditorState: Dispatch<EntityEditorStateAction>
) {
  useWindowEventListener('focusin', (event) => {
    if (event.target instanceof HTMLElement) {
      for (
        let element: HTMLElement | null = event.target;
        element;
        element = element.parentElement
      ) {
        const entityId = element.dataset.entityid;
        if (entityId) {
          if (entityId !== editorState.activeEntityId) {
            dispatchEditorState(new SetActiveEntityAction(entityId));
          }
          break;
        }
      }
    }
  });
}
