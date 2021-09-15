import { useContext } from 'react';
import React, { useCallback } from 'react';
import {
  AddEntityDraftAction,
  Button,
  Column,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  SetActiveEntityAction,
  TypePicker,
} from '../..';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EntityEditorOverviewProps {}

export function EntityEditorOverview(): JSX.Element {
  const { activeEntityId, drafts } = useContext(EntityEditorStateContext);
  const dispatchEditorState = useContext(EntityEditorDispatchContext);

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
      {drafts.map((draft) => (
        <Button
          key={draft.id}
          selected={draft.id === activeEntityId}
          rounded={false}
          onClick={() => handleEntityClick(draft.id)}
        >
          <p className="dd-text-subtitle2">{draft.entity?.entitySpec.name}</p>
          <p className="dd-text-body">{draft.entity?.name || '(Unnamed)'}</p>
        </Button>
      ))}
    </Column>
  );
}
