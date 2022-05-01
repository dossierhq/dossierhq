import { Field, Input } from '@jonasb/datadata-design';
import type { ChangeEvent, Dispatch } from 'react';
import React, { useCallback } from 'react';
import type {
  EntityEditorDraftState,
  EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { EntityFieldEditor } from './EntityFieldEditor';

interface Props {
  draft: EntityEditorDraftState;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditor({ draft, dispatchEntityEditorState }: Props) {
  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatchEntityEditorState(new EntityEditorActions.SetName(draft.id, event.target.value));
    },
    [dispatchEntityEditorState, draft.id]
  );

  if (!draft.draft) {
    return null;
  }
  return (
    <>
      <Field>
        <Field.Label>Name</Field.Label>
        <Field.Control>
          <Input value={draft.draft.name} onChange={handleNameChange} />
        </Field.Control>
      </Field>
      {draft.draft.fields.map((field) => (
        <EntityFieldEditor key={field.fieldSpec.name} field={field} />
      ))}
    </>
  );
}
