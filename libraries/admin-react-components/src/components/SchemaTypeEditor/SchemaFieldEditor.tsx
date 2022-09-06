import { FieldType, RichTextNodeType } from '@jonasb/datadata-core';
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
import { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldDraft,
  SchemaFieldSelector,
  SchemaTypeSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { FieldEntityTypeSelector } from './FieldEntityTypeSelector.js';
import { FieldValueTypeSelector } from './FieldValueTypeSelector.js';
import { RichTextNodeSelector } from './RichTextNodeSelector.js';

interface Props {
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  fieldSelector: SchemaFieldSelector;
  fieldDraft: SchemaFieldDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenameField: (selector: SchemaFieldSelector | SchemaTypeSelector) => void;
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
  typeDraft,
  fieldSelector,
  fieldDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
  onAddOrRenameField,
}: Props) {
  const canChangeRequired = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeType = fieldDraft.status === 'new';
  const canChangeMultiline = fieldDraft.status === 'new';
  const canDeleteOrRenameField = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeRichTextNodes = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeEntityTypes = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeValueTypes = fieldDraft.status === 'new'; //TODO too restrictive
  const canChangeAdminOnly = fieldDraft.status === 'new'; //TODO too restrictive

  const fieldCanBeName =
    typeDraft.kind === 'entity' && fieldDraft.type === FieldType.String && !fieldDraft.list;

  const handleDropDownItemClick = useCallback(
    ({ id }: { id: string }) => {
      switch (id) {
        case 'delete':
          dispatchSchemaEditorState(new SchemaEditorActions.DeleteField(fieldSelector));
          break;
        case 'rename':
          onAddOrRenameField(fieldSelector);
          break;
      }
    },
    [dispatchSchemaEditorState, fieldSelector, onAddOrRenameField]
  );

  const dropDownItems = canDeleteOrRenameField
    ? [
        { id: 'rename', title: 'Rename field' },
        { id: 'delete', title: 'Delete field' },
      ]
    : [];
  const showEntityTypes =
    fieldDraft.type === FieldType.EntityType ||
    (fieldDraft.type === FieldType.RichText &&
      (!fieldDraft.richTextNodes ||
        fieldDraft.richTextNodes.length === 0 ||
        fieldDraft.richTextNodes?.includes(RichTextNodeType.entity)));
  const showValueTypes =
    fieldDraft.type === FieldType.ValueType ||
    (fieldDraft.type === FieldType.RichText &&
      (!fieldDraft.richTextNodes ||
        fieldDraft.richTextNodes.length === 0 ||
        fieldDraft.richTextNodes?.includes(RichTextNodeType.valueItem)));
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
          <Field.LabelColumn />
          <Field.BodyColumn>
            <Checkbox
              checked={fieldDraft.adminOnly}
              disabled={!canChangeAdminOnly}
              onChange={(event) =>
                dispatchSchemaEditorState(
                  new SchemaEditorActions.ChangeFieldAdminOnly(fieldSelector, event.target.checked)
                )
              }
            >
              Admin only
            </Checkbox>
          </Field.BodyColumn>
        </Field>
        {fieldCanBeName ? (
          <Field horizontal>
            <Field.LabelColumn />
            <Field.BodyColumn>
              <Checkbox
                checked={fieldDraft.isName}
                onChange={(event) =>
                  dispatchSchemaEditorState(
                    new SchemaEditorActions.ChangeFieldIsName(fieldSelector, event.target.checked)
                  )
                }
              >
                Is name
              </Checkbox>
            </Field.BodyColumn>
          </Field>
        ) : null}
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
        {fieldDraft.type === FieldType.String ? (
          <Field horizontal>
            <Field.LabelColumn />
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  <Checkbox
                    disabled={!canChangeMultiline}
                    checked={fieldDraft.multiline}
                    onChange={(event) =>
                      dispatchSchemaEditorState(
                        new SchemaEditorActions.ChangeFieldMultiline(
                          fieldSelector,
                          event.target.checked
                        )
                      )
                    }
                  >
                    Multiline
                  </Checkbox>
                </Field.Control>
              </Field>
            </Field.BodyColumn>
          </Field>
        ) : null}
        {fieldDraft.type === FieldType.RichText ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Rich text nodes</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  {canChangeRichTextNodes ? (
                    <RichTextNodeSelector
                      fieldSelector={fieldSelector}
                      richTextNodes={fieldDraft.richTextNodes ?? []}
                      dispatchSchemaEditorState={dispatchSchemaEditorState}
                    />
                  ) : (
                    <RichTextNodeDisplay richTextNodes={fieldDraft.richTextNodes ?? []} />
                  )}
                </Field.Control>
              </Field>
            </Field.BodyColumn>
          </Field>
        ) : null}
        {showEntityTypes ? (
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
        {showValueTypes ? (
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

function RichTextNodeDisplay({ richTextNodes }: { richTextNodes: string[] }) {
  return (
    <TagInput>
      {richTextNodes.map((richTextNode) => (
        <Tag key={richTextNode}>{richTextNode}</Tag>
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
