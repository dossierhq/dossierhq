import { FieldType } from '@dossierhq/core';
import { Button, Checkbox, Field, GridList, GridListItem, useDragAndDrop } from '@dossierhq/design';
import type { Dispatch } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldSelector,
  SchemaTypeSelector,
  SchemaComponentTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { NameFieldSelector } from './NameFieldSelector.js';
import { PatternSelector } from './PatternSelector.js';
import { SchemaFieldEditor } from './SchemaFieldEditor.js';

interface Props {
  typeSelector: SchemaTypeSelector;
  typeDraft: SchemaEntityTypeDraft | SchemaComponentTypeDraft;
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
  const potentialNameFields =
    typeDraft.kind === 'entity'
      ? typeDraft.fields
          .filter((it) => it.type === FieldType.String && !it.list)
          .map((it) => it.name)
      : [];

  const { dragAndDropHooks: fieldsDragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: (event) => {
      if (event.target.dropPosition === 'on') {
        return;
      }
      dispatchSchemaEditorState(
        new SchemaEditorActions.ReorderFields(
          typeSelector,
          String([...event.keys][0]),
          event.target.dropPosition,
          String(event.target.key),
        ),
      );
    },
  });

  return (
    <>
      <Field horizontal>
        <Field.LabelColumn />
        <Field.BodyColumn>
          <Checkbox
            checked={typeDraft.adminOnly}
            onChange={(event) =>
              dispatchSchemaEditorState(
                new SchemaEditorActions.ChangeTypeAdminOnly(typeSelector, event.target.checked),
              )
            }
          >
            Admin only
          </Checkbox>
        </Field.BodyColumn>
      </Field>
      {typeDraft.kind === 'entity' && potentialNameFields.length > 0 ? (
        <Field horizontal>
          <Field.LabelColumn>
            <Field.Label>Name field</Field.Label>
          </Field.LabelColumn>
          <Field.BodyColumn>
            <NameFieldSelector
              value={typeDraft.nameField}
              potentialNameFields={potentialNameFields}
              typeSelector={typeSelector}
              dispatchSchemaEditorState={dispatchSchemaEditorState}
            />
          </Field.BodyColumn>
        </Field>
      ) : null}
      {'authKeyPattern' in typeDraft ? (
        <Field horizontal>
          <Field.LabelColumn>
            <Field.Label>Auth key pattern</Field.Label>
          </Field.LabelColumn>
          <Field.BodyColumn>
            <PatternSelector
              value={typeDraft.authKeyPattern}
              schemaEditorState={schemaEditorState}
              onChange={(value) =>
                dispatchSchemaEditorState(
                  new SchemaEditorActions.ChangeTypeAuthKeyPattern(typeSelector, value),
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
      <GridList
        aria-label={`Fields for ${typeDraft.name}`}
        dragAndDropHooks={fieldsDragAndDropHooks}
      >
        {typeDraft.fields.map((fieldDraft) => (
          <GridListItem
            key={fieldDraft.name}
            id={fieldDraft.name}
            textValue={fieldDraft.name}
            marginVertical={1}
          >
            <SchemaFieldEditor
              fieldSelector={{ ...typeSelector, fieldName: fieldDraft.name }}
              fieldDraft={fieldDraft}
              schemaEditorState={schemaEditorState}
              dispatchSchemaEditorState={dispatchSchemaEditorState}
              onAddOrRenameField={onAddOrRenameField}
            />
          </GridListItem>
        ))}
      </GridList>
    </>
  );
}
