import type { FieldType } from '@jonasb/datadata-core';
import { Button, Card, Field, SelectDisplay } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback } from 'react';
import type * as SchemaEditorReducer from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

interface Props {
  type: SchemaEditorReducer.SchemaEntityTypeDraft | SchemaEditorReducer.SchemaValueTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorReducer.SchemaEditorStateAction>;
}

export function SchemaTypeEditor({ type, dispatchSchemaEditorState }: Props) {
  return (
    <>
      <Field>
        <Field.Control>
          <AddFieldButton
            kind={type.kind}
            typeName={type.name}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        </Field.Control>
      </Field>
      {type.fields.map((field) => (
        <SchemaFieldEditor key={field.name} field={field} />
      ))}
    </>
  );
}

function AddFieldButton({
  kind,
  typeName,
  dispatchSchemaEditorState,
}: {
  kind: 'entity' | 'value';
  typeName: string;
  dispatchSchemaEditorState: Dispatch<SchemaEditorReducer.SchemaEditorStateAction>;
}) {
  const handleClick = useCallback(() => {
    const fieldName = window.prompt('Field name?');
    if (fieldName) {
      dispatchSchemaEditorState(new SchemaEditorActions.AddTypeField(kind, typeName, fieldName));
    }
  }, [dispatchSchemaEditorState, kind, typeName]);
  return <Button onClick={handleClick}>Add field</Button>;
}

function SchemaFieldEditor({ field }: { field: SchemaEditorReducer.SchemaFieldDraft }) {
  return (
    <Card>
      <Card.Header>{field.name}</Card.Header>
      <Card.Content>
        <Field horizontal>
          <Field.LabelColumn>
            <Field.Label>Type</Field.Label>
          </Field.LabelColumn>
          <Field.BodyColumn>
            <Field.Control>
              <FieldTypeSelector type={field.type} list={field.list} />
            </Field.Control>
          </Field.BodyColumn>
        </Field>
      </Card.Content>
    </Card>
  );
}
function FieldTypeSelector({ type, list }: { type: FieldType; list: boolean }) {
  const value = list ? `${type}List` : type;
  return (
    <SelectDisplay value={value}>
      <SelectDisplay.Option value="Boolean">Boolean</SelectDisplay.Option>
      <SelectDisplay.Option value="BooleanList">Boolean list</SelectDisplay.Option>
      <SelectDisplay.Option value="EntityType">EntityType</SelectDisplay.Option>
      <SelectDisplay.Option value="EntityTypeList">EntityType list</SelectDisplay.Option>
      <SelectDisplay.Option value="Location">Location</SelectDisplay.Option>
      <SelectDisplay.Option value="LocationList">Location list</SelectDisplay.Option>
      <SelectDisplay.Option value="RichText">RichText</SelectDisplay.Option>
      <SelectDisplay.Option value="RichTextList">RichText list</SelectDisplay.Option>
      <SelectDisplay.Option value="String">String</SelectDisplay.Option>
      <SelectDisplay.Option value="StringList">String list</SelectDisplay.Option>
      <SelectDisplay.Option value="ValueType">ValueType</SelectDisplay.Option>
      <SelectDisplay.Option value="ValueTypeList">ValueType list</SelectDisplay.Option>
    </SelectDisplay>
  );
}
