import { Menu } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type {
  EntityEditorState,
  EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer';

interface Props {
  entityEditorState: Readonly<EntityEditorState>;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}

export function AdminEntityEditorMenu({ entityEditorState, dispatchEntityEditorState }: Props) {
  const { activeEntityId } = entityEditorState;

  return (
    <Menu>
      <Menu.List>
        {entityEditorState.drafts.map((draft) => (
          <Menu.Item key={draft.id}>
            <a
              className={draft.id === activeEntityId ? 'is-active' : undefined}
              onClick={() =>
                dispatchEntityEditorState(new EntityEditorActions.SetActiveEntity(draft.id))
              }
            >
              {draft.entity?.type}
            </a>
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
