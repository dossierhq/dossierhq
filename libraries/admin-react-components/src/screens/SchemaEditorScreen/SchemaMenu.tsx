import { Menu } from '@jonasb/datadata-design';
import React from 'react';
import type { SchemaEditorState } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

export function SchemaMenu({
  schemaEditorState,
}: {
  schemaEditorState: Readonly<SchemaEditorState>;
}) {
  return (
    <Menu>
      <Menu.Label>Entity types</Menu.Label>
      <Menu.List>
        {schemaEditorState.entityTypes.map((typeDraft) => (
          <Menu.Item key={typeDraft.name}>
            <a>{typeDraft.name}</a>
          </Menu.Item>
        ))}
      </Menu.List>
      <Menu.Label>Value types</Menu.Label>
      <Menu.List>
        {schemaEditorState.valueTypes.map((typeDraft) => (
          <Menu.Item key={typeDraft.name}>
            <a>{typeDraft.name}</a>
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
