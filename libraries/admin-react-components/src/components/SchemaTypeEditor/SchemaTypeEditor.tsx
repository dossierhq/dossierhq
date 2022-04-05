import { FieldType } from '@jonasb/datadata-core';
import { Button, Card, Field, Input, SelectDisplay } from '@jonasb/datadata-design';
import type { ChangeEvent, Dispatch } from 'react';
import React, { useCallback } from 'react';
import type {
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldDraft,
  SchemaFieldSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

interface FieldTypeItem {
  value: string;
  display: string;
  type: FieldType;
  list: boolean;
}

function fieldTypeValue(type: FieldType, list: boolean) {
  return list ? `${type}List` : type;
}

const FIELD_TYPE_ITEMS: FieldTypeItem[] = [
  FieldType.Boolean,
  FieldType.EntityType,
  FieldType.Location,
  FieldType.RichText,
  FieldType.String,
  FieldType.ValueType,
].flatMap((type) =>
  [false, true].map((list) => ({
    value: fieldTypeValue(type, list),
    display: list ? `${type} list` : type,
    type,
    list,
  }))
);

interface Props {
  type: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaTypeEditor({ type, dispatchSchemaEditorState }: Props) {
  const typeSelector = { kind: type.kind, typeName: type.name };
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
        <SchemaFieldEditor
          key={field.name}
          fieldSelector={{ ...typeSelector, fieldName: field.name }}
          field={field}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
        />
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
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const handleClick = useCallback(() => {
    const fieldName = window.prompt('Field name?');
    if (fieldName) {
      dispatchSchemaEditorState(new SchemaEditorActions.AddTypeField(kind, typeName, fieldName));
    }
  }, [dispatchSchemaEditorState, kind, typeName]);
  return <Button onClick={handleClick}>Add field</Button>;
}

function SchemaFieldEditor({
  fieldSelector,
  field,
  dispatchSchemaEditorState,
}: {
  fieldSelector: SchemaFieldSelector;
  field: SchemaFieldDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const canChangeType = field.status === 'new';
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
              {canChangeType ? (
                <FieldTypeSelector
                  fieldSelector={fieldSelector}
                  type={field.type}
                  list={field.list}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                />
              ) : (
                <FieldTypeDisplay type={field.type} list={field.list} />
              )}
            </Field.Control>
          </Field.BodyColumn>
        </Field>
      </Card.Content>
    </Card>
  );
}

function FieldTypeDisplay({ type, list }: { type: FieldType; list: boolean }) {
  const value = fieldTypeValue(type, list);
  const item = FIELD_TYPE_ITEMS.find((it) => it.value === value);
  return <Input value={item?.display} readOnly />;
}

function FieldTypeSelector({
  fieldSelector,
  type,
  list,
  dispatchSchemaEditorState,
}: {
  fieldSelector: SchemaFieldSelector;
  type: FieldType;
  list: boolean;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const item = FIELD_TYPE_ITEMS.find((it) => it.value === event.currentTarget.value);
      if (item) {
        dispatchSchemaEditorState(
          new SchemaEditorActions.ChangeFieldType(fieldSelector, item.type, item.list)
        );
      }
    },
    [dispatchSchemaEditorState, fieldSelector]
  );

  return (
    <SelectDisplay value={fieldTypeValue(type, list)} onChange={handleChange}>
      {FIELD_TYPE_ITEMS.map(({ value, display }) => (
        <SelectDisplay.Option key={value} value={value}>
          {display}
        </SelectDisplay.Option>
      ))}
    </SelectDisplay>
  );
}
