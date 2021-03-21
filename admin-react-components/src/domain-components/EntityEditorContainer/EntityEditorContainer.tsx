import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';
import { EntityEditor, EntityMetadata } from '../..';
import { TypePicker } from '../TypePicker/TypePicker';
import { AddEntityDraftAction, SetActiveEntityAction } from '../EntityEditor/EntityEditorReducer';
import { useWindowEventListener } from '../../utils/EventUtils';
import { joinClassNames } from '../../utils/ClassNameUtils';

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
            style={{ flexGrow: 1 }}
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
        {activeEntityId ? <EntityMetadata className="h-100" entityId={activeEntityId} /> : null}
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
