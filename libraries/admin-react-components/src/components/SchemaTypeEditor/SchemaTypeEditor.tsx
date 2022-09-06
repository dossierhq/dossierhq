import { Button, Checkbox, Field } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldSelector,
  SchemaTypeSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaFieldEditor } from './SchemaFieldEditor.js';

interface Props {
  typeSelector: SchemaTypeSelector;
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenameField: (selector: SchemaFieldSelector | SchemaTypeSelector) => void;
}

export function SchemaTypeEditor({
  typeSelector,
  typeDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
  onAddOrRenameField,
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
          <Button onClick={() => onAddOrRenameField(typeSelector)}>Add field</Button>
        </Field.Control>
      </Field>
      {typeDraft.fields.map((fieldDraft) => (
        <SchemaFieldEditor
          key={fieldDraft.name}
          typeDraft={typeDraft}
          fieldSelector={{ ...typeSelector, fieldName: fieldDraft.name }}
          fieldDraft={fieldDraft}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
          onAddOrRenameField={onAddOrRenameField}
        />
      ))}
    </>
  );
}
