import React, { useContext } from 'react';
import {
  EntityEditor,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  EntityEditorOverview,
  EntityMetadata,
  SetActiveEntityAction,
} from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';
import { findAscendantElement } from '../../utils/DOMUtils';
import { useWindowEventListener } from '../../utils/EventUtils';

export interface EntityEditorContainerProps {
  className?: string;
}

export function EntityEditorContainer({ className }: EntityEditorContainerProps): JSX.Element {
  const editorState = useContext(EntityEditorStateContext);
  useEntityEditorFocused();

  const { activeEntityId } = editorState;

  return (
    <div className={joinClassNames('dd flex-row overflow-hidden', className)}>
      <EntityEditorOverview />
      <div className="dd flex-grow flex-column g-2 overflow-y-scroll px-3">
        {editorState.drafts.map((draftState) => (
          <EntityEditor key={draftState.id} entityId={draftState.id} />
        ))}
      </div>
      <div>
        {activeEntityId ? (
          <EntityMetadata className="h-100" entityId={activeEntityId} {...{ editorState }} />
        ) : null}
      </div>
    </div>
  );
}

function useEntityEditorFocused() {
  const editorState = useContext(EntityEditorStateContext);
  const dispatchEditorState = useContext(EntityEditorDispatchContext);
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
