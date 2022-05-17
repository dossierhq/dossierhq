import { findAscendantHTMLElement, useWindowEventListener } from '@jonasb/datadata-design';
import React, { useContext } from 'react';
import {
  LegacyEntityEditorStateContext,
  LegacyEntityEditorDispatchContext,
} from '../../contexts/LegacyEntityEditorState';
import { joinClassNames } from '../../utils/ClassNameUtils';
import { LegacyEntityEditor } from '../LegacyEntityEditor/LegacyEntityEditor';
import { LegacySetActiveEntityAction } from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import { LegacyEntityEditorOverview } from '../LegacyEntityEditorOverview/LegacyEntityEditorOverview';
import { LegacyEntityMetadata } from '../LegacyEntityMetadata/LegacyEntityMetadata';

export interface LegacyEntityEditorContainerProps {
  className?: string;
}

export function LegacyEntityEditorContainer({
  className,
}: LegacyEntityEditorContainerProps): JSX.Element {
  const { activeEntityId, drafts } = useContext(LegacyEntityEditorStateContext);
  useEntityEditorFocused();

  return (
    <div className={joinClassNames('dd-flex-row dd-overflow-hidden', className)}>
      <LegacyEntityEditorOverview />
      <div className="dd-flex-grow dd-flex-column dd-g-2 dd-overflow-y-scroll dd-px-3">
        {drafts.map((draftState) => (
          <LegacyEntityEditor key={draftState.id} entityId={draftState.id} />
        ))}
      </div>
      <div>
        {activeEntityId ? (
          <LegacyEntityMetadata className="dd-h-100" entityId={activeEntityId} />
        ) : null}
      </div>
    </div>
  );
}

function useEntityEditorFocused() {
  const { activeEntityId } = useContext(LegacyEntityEditorStateContext);
  const dispatchEditorState = useContext(LegacyEntityEditorDispatchContext);
  useWindowEventListener('focusin', (event) => {
    if (event.target instanceof HTMLElement) {
      const editorElement = findAscendantHTMLElement(event.target, (el) => !!el.dataset.entityid);
      const focusedEntityId = editorElement?.dataset.entityid;
      if (focusedEntityId && focusedEntityId !== activeEntityId) {
        dispatchEditorState(new LegacySetActiveEntityAction(focusedEntityId));
      }
    }
  });
}
