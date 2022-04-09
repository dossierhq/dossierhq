import { FieldType } from '@jonasb/datadata-core';
import { Button, Card, Checkbox, Field, Input, SelectDisplay } from '@jonasb/datadata-design';
import type { ChangeEvent, Dispatch } from 'react';
import React, { useCallback } from 'react';
import type {
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldDraft,
  SchemaFieldSelector,
  SchemaTypeSelector,
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
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaTypeEditor({ typeDraft, dispatchSchemaEditorState }: Props) {
  const typeSelector = { kind: typeDraft.kind, typeName: typeDraft.name };
  const canChangeAdminOnly = typeDraft.status === 'new'; //TODO too restrictive
  return (
    <>
      <Field>
        <Field.Control>
          <AddFieldButton
            typeSelector={typeSelector}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        </Field.Control>
      </Field>
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
      {typeDraft.fields.map((fieldDraft) => (
        <SchemaFieldEditor
          key={fieldDraft.name}
          fieldSelector={{ ...typeSelector, fieldName: fieldDraft.name }}
          fieldDraft={fieldDraft}
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

function SchemaFieldEditor({
  fieldSelector,
  fieldDraft,
  dispatchSchemaEditorState,
}: {
  fieldSelector: SchemaFieldSelector;
  fieldDraft: SchemaFieldDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const canChangeRequired = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeType = fieldDraft.status === 'new';
  const canDeleteOrRenameField = fieldDraft.status === 'new'; //TODO too restrictive

  const handleDropDownItemClick = useCallback(
    ({ id }: { id: string }) => {
      switch (id) {
        case 'delete':
          dispatchSchemaEditorState(new SchemaEditorActions.DeleteField(fieldSelector));
          break;
        case 'rename': {
          const fieldName = window.prompt('New field name?', fieldSelector.fieldName);
          if (fieldName) {
            dispatchSchemaEditorState(
              new SchemaEditorActions.RenameField(fieldSelector, fieldName)
            );
          }
          break;
        }
      }
    },
    [dispatchSchemaEditorState, fieldSelector]
  );

  const dropDownItems = canDeleteOrRenameField
    ? [
        { id: 'rename', title: 'Rename field' },
        { id: 'delete', title: 'Delete field' },
      ]
    : [];
  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>{fieldDraft.name}</Card.HeaderTitle>
        {dropDownItems.length > 0 ? (
          <Card.HeaderDropDown
            items={dropDownItems}
            renderItem={(item) => item.title}
            onItemClick={handleDropDownItemClick}
          />
        ) : null}
      </Card.Header>
      <Card.Content>
        <Field horizontal>
          <Field.LabelColumn />
          <Field.BodyColumn>
            <Checkbox
              checked={fieldDraft.required}
              disabled={!canChangeRequired}
              onChange={(event) =>
                dispatchSchemaEditorState(
                  new SchemaEditorActions.ChangeFieldRequired(fieldSelector, event.target.checked)
                )
              }
            >
              Required
            </Checkbox>
          </Field.BodyColumn>
        </Field>
        <Field horizontal>
          <Field.LabelColumn>
            <Field.Label>Type</Field.Label>
          </Field.LabelColumn>
          <Field.BodyColumn>
            <Field.Control>
              {canChangeType ? (
                <FieldTypeSelector
                  fieldSelector={fieldSelector}
                  type={fieldDraft.type}
                  list={fieldDraft.list}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                />
              ) : (
                <FieldTypeDisplay type={fieldDraft.type} list={fieldDraft.list} />
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
