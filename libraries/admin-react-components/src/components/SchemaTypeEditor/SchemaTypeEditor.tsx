import type { FieldType } from '@jonasb/datadata-core';
import { Card, Field, SelectDisplay } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type {
  SchemaEditorStateAction,
  SchemaFieldDraft,
  SchemaTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

interface Props {
  type: SchemaTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaTypeEditor({ type, dispatchSchemaEditorState: _unused }: Props) {
  return (
    <>
      {type.fields.map((field) => (
        <SchemaFieldEditor key={field.name} field={field} />
      ))}
    </>
  );
}

function SchemaFieldEditor({ field }: { field: SchemaFieldDraft }) {
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
