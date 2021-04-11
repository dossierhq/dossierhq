import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';
import { AddEntityDraftAction, TypePicker } from '../..';

export interface EntityEditorOverviewProps {
  editorState: EntityEditorState;
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditorOverview({
  editorState,
  dispatchEditorState,
}: EntityEditorOverviewProps): JSX.Element {
  const handleCreateEntity = useCallback(
    (type: string) => dispatchEditorState(new AddEntityDraftAction({ newType: type })),
    [dispatchEditorState]
  );

  return (
    <div>
      <TypePicker
        id="create-entity-picker"
        text="Create"
        showEntityTypes
        onTypeSelected={handleCreateEntity}
      />
      {editorState.drafts.map((draft) => (
        <div key={draft.id}>
          <a href={`#${draft.id}`}>{draft.entity?.name ?? 'Unnamed'}</a>
        </div>
      ))}
    </div>
  );
}
