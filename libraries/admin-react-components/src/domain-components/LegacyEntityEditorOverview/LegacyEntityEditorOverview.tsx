import React, { useCallback, useContext } from 'react';
import {
  LegacyEntityEditorDispatchContext,
  LegacyEntityEditorStateContext,
} from '../../contexts/LegacyEntityEditorState';
import { Button } from '../../generic-components/Button/Button';
import { Column } from '../../generic-components/Column/Column';
import {
  LegacyAddEntityDraftAction,
  LegacySetActiveEntityAction,
} from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import { LegacyTypePicker } from '../LegacyTypePicker/LegacyTypePicker';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LegacyEntityEditorOverviewProps {}

export function LegacyEntityEditorOverview(): JSX.Element {
  const { activeEntityId, drafts } = useContext(LegacyEntityEditorStateContext);
  const dispatchEditorState = useContext(LegacyEntityEditorDispatchContext);

  const handleCreateEntity = useCallback(
    (type: string) => dispatchEditorState(new LegacyAddEntityDraftAction({ newType: type })),
    [dispatchEditorState]
  );
  const handleEntityClick = useCallback(
    (entityId: string) => {
      dispatchEditorState(new LegacySetActiveEntityAction(entityId));
      document.getElementById(entityId)?.scrollIntoView({ behavior: 'smooth' });
    },
    [dispatchEditorState]
  );

  return (
    <Column>
      <LegacyTypePicker text="Create" showEntityTypes onTypeSelected={handleCreateEntity} />
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
