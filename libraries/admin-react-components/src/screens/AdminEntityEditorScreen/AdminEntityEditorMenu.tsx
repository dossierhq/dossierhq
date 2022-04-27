import { Menu } from '@jonasb/datadata-design';
import React from 'react';
import type { EntityEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer';

interface Props {
  entityEditorState: Readonly<EntityEditorState>;
}

export function AdminEntityEditorMenu({ entityEditorState }: Props) {
  return (
    <Menu>
      <Menu.List>
        {entityEditorState.drafts.map((draft) => (
          <Menu.Item key={draft.id}>{draft.id}</Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
