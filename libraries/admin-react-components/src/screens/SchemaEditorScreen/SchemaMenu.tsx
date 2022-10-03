import { Menu } from '@jonasb/datadata-design';
import type { Dispatch, MouseEvent } from 'react';
import React, { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldSelector,
  SchemaPatternSelector,
  SchemaTypeSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

export function SchemaMenu({
  schemaEditorState,
  dispatchEditorState,
}: {
  schemaEditorState: Readonly<SchemaEditorState>;
  dispatchEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const { activeSelector, entityTypes, valueTypes } = schemaEditorState;
  return (
    <Menu>
      {entityTypes.length > 0 ? (
        <>
          <Menu.Label>Entity types</Menu.Label>
          <Menu.List>
            {entityTypes.map((typeDraft) => (
              <TypeDraftItem
                key={typeDraft.name}
                {...{ activeSelector, typeDraft, dispatchEditorState }}
              />
            ))}
          </Menu.List>
        </>
      ) : null}
      {valueTypes.length > 0 ? (
        <>
          <Menu.Label>Value types</Menu.Label>
          <Menu.List>
            {valueTypes.map((typeDraft) => (
              <TypeDraftItem
                key={typeDraft.name}
                {...{ activeSelector, typeDraft, dispatchEditorState }}
              />
            ))}
          </Menu.List>
        </>
      ) : null}
    </Menu>
  );
}

function TypeDraftItem({
  activeSelector,
  typeDraft,
  dispatchEditorState,
}: {
  activeSelector: null | SchemaFieldSelector | SchemaTypeSelector | SchemaPatternSelector;
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  dispatchEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      dispatchEditorState(
        new SchemaEditorActions.SetActiveSelector(typeDraftToSelector(typeDraft), false, true)
      );
    },
    [dispatchEditorState, typeDraft]
  );
  return (
    <Menu.Item>
      <a
        id={`${typeDraft.name}-menuItem`}
        className={isTypeDraftActive(typeDraft, activeSelector) ? 'is-active' : undefined}
        onClick={handleClick}
      >
        {typeDraft.name}
      </a>
    </Menu.Item>
  );
}

function typeDraftToSelector(
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft
): SchemaTypeSelector {
  const { kind, name: typeName } = typeDraft;
  return { kind, typeName };
}

function isTypeDraftActive(
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft,
  activeSelector: null | SchemaFieldSelector | SchemaTypeSelector | SchemaPatternSelector
) {
  if (!activeSelector) return false;
  return (
    typeDraft.kind === activeSelector.kind &&
    typeDraft.name === activeSelector.typeName &&
    !('fieldName' in activeSelector)
  );
}
