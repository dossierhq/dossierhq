import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from '../..';
import { AddEntityDraftAction, Button, Column, SetActiveEntityAction, TypePicker } from '../..';

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
  const handleEntityClick = useCallback(
    (entityId: string) => {
      dispatchEditorState(new SetActiveEntityAction(entityId));
      document.getElementById(entityId)?.scrollIntoView({ behavior: 'smooth' });
    },
    [dispatchEditorState]
  );

  return (
    <Column>
      <TypePicker
        id="create-entity-picker"
        text="Create"
        showEntityTypes
        onTypeSelected={handleCreateEntity}
      />
      {editorState.drafts.map((draft) => (
        <Button
          key={draft.id}
          selected={draft.id === editorState.activeEntityId}
          rounded={false}
          onClick={() => handleEntityClick(draft.id)}
        >
          <p className="dd text-subtitle2">{draft.entity?.entitySpec.name}</p>
          <p className="dd text-body">{draft.entity?.name || '(Unnamed)'}</p>
        </Button>
      ))}
    </Column>
  );
}
