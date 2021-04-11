import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';
import { EntityEditor, EntityMetadata, TypePicker } from '../..';
import { AddEntityDraftAction, SetActiveEntityAction } from '../EntityEditor/EntityEditorReducer';
import { joinClassNames } from '../../utils/ClassNameUtils';
import { findAscendantElement } from '../../utils/DOMUtils';
import { useWindowEventListener } from '../../utils/EventUtils';

export interface EntityEditorContainerProps {
  className?: string;
  editorState: EntityEditorState;
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditorContainer({
  className,
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
    <div className={joinClassNames('dd flex-row g-2 overflow-hidden', className)}>
      <div className="dd flex-grow flex-column g-2 overflow-y-scroll">
        {editorState.drafts.map((draftState) => (
          <EntityEditor
            key={draftState.id}
            entityId={draftState.id}
            {...{ editorState, dispatchEditorState }}
          />
        ))}
        <TypePicker
          id="create-entity-picker"
          text="Create entity"
          showEntityTypes
          onTypeSelected={handleCreateEntity}
        />
      </div>
      <div>
        {activeEntityId ? (
          <EntityMetadata className="h-100" entityId={activeEntityId} {...{ editorState }} />
        ) : null}
      </div>
    </div>
  );
}

function useEntityEditorFocused(
  editorState: EntityEditorState,
  dispatchEditorState: Dispatch<EntityEditorStateAction>
) {
  useWindowEventListener('focusin', (event) => {
    if (event.target instanceof HTMLElement) {
      const editorElement = findAscendantElement(event.target, (el) => !!el.dataset.entityid);
      const focusedEntityId = editorElement?.dataset.entityid;
      if (focusedEntityId && focusedEntityId !== editorState.activeEntityId) {
        dispatchEditorState(new SetActiveEntityAction(focusedEntityId));
      }
    }
  });
}
