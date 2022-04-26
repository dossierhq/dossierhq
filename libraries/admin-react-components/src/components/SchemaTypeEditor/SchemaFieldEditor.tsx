import { FieldType } from '@jonasb/datadata-core';
import {
  Card,
  Checkbox,
  Field,
  Input,
  SelectDisplay,
  Tag,
  TagInput,
} from '@jonasb/datadata-design';
import type { ChangeEvent, Dispatch } from 'react';
import React, { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaFieldDraft,
  SchemaFieldSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { FieldEntityTypeSelector } from './FieldEntityTypeSelector';
import { FieldValueTypeSelector } from './FieldValueTypeSelector';

interface Props {
  fieldSelector: SchemaFieldSelector;
  fieldDraft: SchemaFieldDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

interface FieldTypeItem {
  value: string;
  display: string;
  type: FieldType;
  list: boolean;
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

function fieldTypeValue(type: FieldType, list: boolean) {
  return list ? `${type}List` : type;
}

export function SchemaFieldEditor({
  fieldSelector,
  fieldDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
}: Props) {
  const canChangeRequired = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeType = fieldDraft.status === 'new';
  const canDeleteOrRenameField = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeEntityTypes = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeValueTypes = fieldDraft.status === 'new'; //TODO too restrictive

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
          <Card.HeaderDropdown
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
            <Field>
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
            </Field>
          </Field.BodyColumn>
        </Field>
        {fieldDraft.type === FieldType.EntityType ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Entity types</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  {canChangeEntityTypes ? (
                    <FieldEntityTypeSelector
                      fieldSelector={fieldSelector}
                      entityTypes={fieldDraft.entityTypes ?? []}
                      schemaEditorState={schemaEditorState}
                      dispatchSchemaEditorState={dispatchSchemaEditorState}
                    />
                  ) : (
                    <FieldEntityTypeDisplay entityTypes={fieldDraft.entityTypes ?? []} />
                  )}
                </Field.Control>
              </Field>
            </Field.BodyColumn>
          </Field>
        ) : null}
        {fieldDraft.type === FieldType.ValueType ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Value types</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  {canChangeValueTypes ? (
                    <FieldValueTypeSelector
                      fieldSelector={fieldSelector}
                      valueTypes={fieldDraft.valueTypes ?? []}
                      schemaEditorState={schemaEditorState}
                      dispatchSchemaEditorState={dispatchSchemaEditorState}
                    />
                  ) : (
                    <FieldValueTypeDisplay valueTypes={fieldDraft.valueTypes ?? []} />
                  )}
                </Field.Control>
              </Field>
            </Field.BodyColumn>
          </Field>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function FieldTypeDisplay({ type, list }: { type: FieldType; list: boolean }) {
  const value = fieldTypeValue(type, list);
  const item = FIELD_TYPE_ITEMS.find((it) => it.value === value);
  return <Input value={item?.display} readOnly />;
}

function FieldEntityTypeDisplay({ entityTypes }: { entityTypes: string[] }) {
  return (
    <TagInput>
      {entityTypes.map((entityType) => (
        <Tag key={entityType}>{entityType}</Tag>
      ))}
    </TagInput>
  );
}
function FieldValueTypeDisplay({ valueTypes }: { valueTypes: string[] }) {
  return (
    <TagInput>
      {valueTypes.map((valueType) => (
        <Tag key={valueType}>{valueType}</Tag>
      ))}
    </TagInput>
  );
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
    <SelectDisplay fullWidth value={fieldTypeValue(type, list)} onChange={handleChange}>
      {FIELD_TYPE_ITEMS.map(({ value, display }) => (
        <SelectDisplay.Option key={value} value={value}>
          {display}
        </SelectDisplay.Option>
      ))}
    </SelectDisplay>
  );
}
