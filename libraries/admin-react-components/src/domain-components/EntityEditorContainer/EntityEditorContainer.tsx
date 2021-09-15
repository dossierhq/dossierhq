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
  const { activeEntityId, drafts } = useContext(EntityEditorStateContext);
  useEntityEditorFocused();

  return (
    <div className={joinClassNames('dd-flex-row dd-overflow-hidden', className)}>
      <EntityEditorOverview />
      <div className="dd-flex-grow dd-flex-column dd-g-2 dd-overflow-y-scroll dd-px-3">
        {drafts.map((draftState) => (
          <EntityEditor key={draftState.id} entityId={draftState.id} />
        ))}
      </div>
      <div>
        {activeEntityId ? <EntityMetadata className="dd-h-100" entityId={activeEntityId} /> : null}
      </div>
    </div>
  );
}

function useEntityEditorFocused() {
  const { activeEntityId } = useContext(EntityEditorStateContext);
  const dispatchEditorState = useContext(EntityEditorDispatchContext);
  useWindowEventListener('focusin', (event) => {
    if (event.target instanceof HTMLElement) {
      const editorElement = findAscendantElement(event.target, (el) => !!el.dataset.entityid);
      const focusedEntityId = editorElement?.dataset.entityid;
      if (focusedEntityId && focusedEntityId !== activeEntityId) {
        dispatchEditorState(new SetActiveEntityAction(focusedEntityId));
      }
    }
  });
}
