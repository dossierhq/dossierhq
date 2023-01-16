import { Button, Checkbox, Field } from '@dossierhq/design';
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
import { PatternSelector } from './PatternSelector.js';
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
  const canChangeAuthKeyPattern = typeSelector.kind === 'entity' && typeDraft.status === 'new';

  return (
    <>
      <Field horizontal>
        <Field.LabelColumn />
        <Field.BodyColumn>
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
        </Field.BodyColumn>
      </Field>
      {'authKeyPattern' in typeDraft ? (
        <Field horizontal>
          <Field.LabelColumn>
            <Field.Label>Auth key pattern</Field.Label>
          </Field.LabelColumn>
          <Field.BodyColumn>
            <PatternSelector
              readOnly={!canChangeAuthKeyPattern}
              value={typeDraft.authKeyPattern}
              schemaEditorState={schemaEditorState}
              onChange={(value) =>
                dispatchSchemaEditorState(
                  new SchemaEditorActions.ChangeTypeAuthKeyPattern(typeSelector, value)
                )
              }
            />
          </Field.BodyColumn>
        </Field>
      ) : undefined}
      <Field horizontal>
        <Field.LabelColumn />
        <Field.BodyColumn>
          <Button onClick={() => onAddOrRenameField(typeSelector)}>Add field</Button>
        </Field.BodyColumn>
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
