import type { Dispatch } from 'react';
import React from 'react';
import type {
  EntityEditorDraftState,
  EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { EntityFieldEditor } from './EntityFieldEditor';

interface Props {
  draft: EntityEditorDraftState;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditor({ draft, dispatchEntityEditorState: _unused }: Props) {
  if (!draft.draft) {
    return null;
  }
  return (
    <>
      {draft.draft.fields.map((field) => (
        <EntityFieldEditor key={field.fieldSpec.name} field={field} />
      ))}
    </>
  );
}
