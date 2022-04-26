import { Button, Checkbox, Field } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaTypeSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaFieldEditor } from './SchemaFieldEditor';

interface Props {
  typeSelector: SchemaTypeSelector;
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaTypeEditor({
  typeSelector,
  typeDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
}: Props) {
  const canChangeAdminOnly = typeDraft.status === 'new'; //TODO too restrictive

  return (
    <>
      <Field>
        <Field.Control>
          <Checkbox
            checked={typeDraft.adminOnly}
            disabled={!canChangeAdminOnly}
            onChange={(event) =>
              dispatchSchemaEditorState(
                new SchemaEditorActions.ChangeTypeAdminOnly(typeSelector, event.target.checked)
              )
            }
          >
            Admin only
          </Checkbox>
        </Field.Control>
      </Field>
      <Field>
        <Field.Control>
          <AddFieldButton
            typeSelector={typeSelector}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        </Field.Control>
      </Field>
      {typeDraft.fields.map((fieldDraft) => (
        <SchemaFieldEditor
          key={fieldDraft.name}
          fieldSelector={{ ...typeSelector, fieldName: fieldDraft.name }}
          fieldDraft={fieldDraft}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
        />
      ))}
    </>
  );
}

function AddFieldButton({
  typeSelector,
  dispatchSchemaEditorState,
}: {
  typeSelector: SchemaTypeSelector;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const handleClick = useCallback(() => {
    const fieldName = window.prompt('Field name?');
    if (fieldName) {
      dispatchSchemaEditorState(
        new SchemaEditorActions.AddField(
          { kind: typeSelector.kind, typeName: typeSelector.typeName },
          fieldName
        )
      );
    }
  }, [dispatchSchemaEditorState, typeSelector.kind, typeSelector.typeName]);
  return <Button onClick={handleClick}>Add field</Button>;
}
