import { Menu } from '@jonasb/datadata-design';
import React from 'react';
import type {
  SchemaEditorState,
  SchemaEntityTypeDraft,
  SchemaFieldSelector,
  SchemaTypeSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

export function SchemaMenu({
  schemaEditorState,
}: {
  schemaEditorState: Readonly<SchemaEditorState>;
}) {
  const { activeSelector, entityTypes, valueTypes } = schemaEditorState;
  return (
    <Menu>
      <Menu.Label>Entity types</Menu.Label>
      <Menu.List>
        {entityTypes.map((typeDraft) => (
          <Menu.Item key={typeDraft.name}>
            <a className={isTypeDraftActive(typeDraft, activeSelector) ? 'is-active' : undefined}>
              {typeDraft.name}
            </a>
          </Menu.Item>
        ))}
      </Menu.List>
      <Menu.Label>Value types</Menu.Label>
      <Menu.List>
        {valueTypes.map((typeDraft) => (
          <Menu.Item key={typeDraft.name}>
            <a className={isTypeDraftActive(typeDraft, activeSelector) ? 'is-active' : undefined}>
              {typeDraft.name}
            </a>
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}

function isTypeDraftActive(
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft,
  activeSelector: null | SchemaFieldSelector | SchemaTypeSelector
) {
  if (!activeSelector) return false;
  return (
    typeDraft.kind === activeSelector.kind &&
    typeDraft.name === activeSelector.typeName &&
    !('fieldName' in activeSelector)
  );
}
