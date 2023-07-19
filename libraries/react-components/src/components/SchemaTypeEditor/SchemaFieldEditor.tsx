import { FieldType, RichTextNodeType } from '@dossierhq/core';
import { Card, Checkbox, Field, GridListDragHandle, Input, SelectDisplay } from '@dossierhq/design';
import type { ChangeEvent, Dispatch } from 'react';
import { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaFieldDraft,
  SchemaFieldSelector,
  SchemaTypeSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { FieldEntityTypeSelector } from './FieldEntityTypeSelector.js';
import { FieldValueTypeSelector } from './FieldValueTypeSelector.js';
import { IndexSelector } from './IndexSelector.js';
import { NumberVariantSelector } from './NumberVariantSelector.js';
import { PatternSelector } from './PatternSelector.js';
import { RichTextNodeSelector } from './RichTextNodeSelector.js';
import { ValuesEditor } from './ValuesEditor.js';

interface Props {
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
  FieldType.Entity,
  FieldType.Location,
  FieldType.Number,
  FieldType.RichText,
  FieldType.String,
  FieldType.ValueItem,
].flatMap((type) =>
  [false, true].map((list) => ({
    value: fieldTypeValue(type, list),
    display: list ? `${type} list` : type,
    type,
    list,
  })),
);

function fieldTypeValue(type: FieldType, list: boolean) {
  return list ? `${type}List` : type;
}

export function SchemaFieldEditor({
  fieldSelector,
  fieldDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
  onAddOrRenameField,
}: Props) {
  const canChangeType = fieldDraft.status === 'new';
  const canChangeIndex = fieldDraft.status === 'new';
  const canDeleteOrRenameField = fieldDraft.status === 'new' || fieldSelector.kind === 'entity'; //TODO enable for value types
  const canChangeAdminOnly = fieldDraft.status === 'new';

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
    [dispatchSchemaEditorState, fieldSelector, onAddOrRenameField],
  );

  const handleMatchPatternChange = useCallback(
    (value: string | null) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.ChangeFieldMatchPattern(fieldSelector, value),
      ),
    [dispatchSchemaEditorState, fieldSelector],
  );

  const handleValuesChange = useCallback(
    (value: { value: string }[]) =>
      dispatchSchemaEditorState(new SchemaEditorActions.ChangeFieldValues(fieldSelector, value)),
    [dispatchSchemaEditorState, fieldSelector],
  );

  const handleIndexChange = useCallback(
    (value: string | null) =>
      dispatchSchemaEditorState(new SchemaEditorActions.ChangeFieldIndex(fieldSelector, value)),
    [dispatchSchemaEditorState, fieldSelector],
  );

  const dropDownItems = canDeleteOrRenameField
    ? [
        { id: 'rename', title: 'Rename field' },
        { id: 'delete', title: 'Delete field' },
      ]
    : [];
  const showEntityTypes =
    fieldDraft.type === FieldType.Entity ||
    (fieldDraft.type === FieldType.RichText &&
      (!fieldDraft.richTextNodesWithPlaceholders ||
        fieldDraft.richTextNodesWithPlaceholders.length === 0 ||
        fieldDraft.richTextNodesWithPlaceholders?.includes(RichTextNodeType.entity)));
  const showLinkEntityTypes =
    fieldDraft.type === FieldType.RichText &&
    (!fieldDraft.richTextNodesWithPlaceholders ||
      fieldDraft.richTextNodesWithPlaceholders.length === 0 ||
      fieldDraft.richTextNodesWithPlaceholders?.includes(RichTextNodeType.entityLink));
  const showValueTypes =
    fieldDraft.type === FieldType.ValueItem ||
    (fieldDraft.type === FieldType.RichText &&
      (!fieldDraft.richTextNodesWithPlaceholders ||
        fieldDraft.richTextNodesWithPlaceholders.length === 0 ||
        fieldDraft.richTextNodesWithPlaceholders?.includes(RichTextNodeType.valueItem)));
  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>
          <GridListDragHandle />
          {fieldDraft.name}
        </Card.HeaderTitle>
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
              onChange={(event) =>
                dispatchSchemaEditorState(
                  new SchemaEditorActions.ChangeFieldRequired(fieldSelector, event.target.checked),
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
                  new SchemaEditorActions.ChangeFieldAdminOnly(fieldSelector, event.target.checked),
                )
              }
            >
              Admin only
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
        {fieldDraft.type === FieldType.String ? (
          <Field horizontal>
            <Field.LabelColumn />
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  <Checkbox
                    checked={fieldDraft.multiline}
                    onChange={(event) =>
                      dispatchSchemaEditorState(
                        new SchemaEditorActions.ChangeFieldMultiline(
                          fieldSelector,
                          event.target.checked,
                        ),
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
        {fieldDraft.type === FieldType.String && (canChangeIndex || fieldDraft.index) ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Index</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <IndexSelector
                readOnly={!canChangeIndex}
                value={fieldDraft.index ?? null}
                schemaEditorState={schemaEditorState}
                onChange={handleIndexChange}
              />
            </Field.BodyColumn>
          </Field>
        ) : null}
        {fieldDraft.type === FieldType.String &&
        (!fieldDraft.values || fieldDraft.values.length === 0) ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Match pattern</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <PatternSelector
                value={fieldDraft.matchPattern ?? null}
                schemaEditorState={schemaEditorState}
                onChange={handleMatchPatternChange}
              />
            </Field.BodyColumn>
          </Field>
        ) : null}
        {fieldDraft.type === FieldType.String && !fieldDraft.matchPattern ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Values</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  <ValuesEditor value={fieldDraft.values ?? []} onChange={handleValuesChange} />
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
                  <RichTextNodeSelector
                    fieldSelector={fieldSelector}
                    richTextNodes={fieldDraft.richTextNodesWithPlaceholders ?? []}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                  />
                  {/* <RichTextNodeDisplay richTextNodes={fieldDraft.richTextNodes ?? []} /> */}
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
                  <FieldEntityTypeSelector
                    fieldSelector={fieldSelector}
                    referenceOrLink="reference"
                    entityTypes={fieldDraft.entityTypes ?? []}
                    schemaEditorState={schemaEditorState}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                  />
                  {/* <FieldEntityTypeDisplay entityTypes={fieldDraft.entityTypes ?? []} /> */}
                </Field.Control>
              </Field>
            </Field.BodyColumn>
          </Field>
        ) : null}
        {showLinkEntityTypes ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Link entity types</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  <FieldEntityTypeSelector
                    fieldSelector={fieldSelector}
                    referenceOrLink="link"
                    entityTypes={fieldDraft.linkEntityTypes ?? []}
                    schemaEditorState={schemaEditorState}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                  />
                  {/* <FieldEntityTypeDisplay entityTypes={fieldDraft.linkEntityTypes ?? []} /> */}
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
                  <FieldValueTypeSelector
                    fieldSelector={fieldSelector}
                    valueTypes={fieldDraft.valueTypes ?? []}
                    schemaEditorState={schemaEditorState}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                  />
                  {/* <FieldValueTypeDisplay valueTypes={fieldDraft.valueTypes ?? []} /> */}
                </Field.Control>
              </Field>
            </Field.BodyColumn>
          </Field>
        ) : null}
        {fieldDraft.type === FieldType.Number ? (
          <Field horizontal>
            <Field.LabelColumn>
              <Field.Label>Number variant</Field.Label>
            </Field.LabelColumn>
            <Field.BodyColumn>
              <Field>
                <Field.Control>
                  <NumberVariantSelector
                    fieldSelector={fieldSelector}
                    integer={!!fieldDraft.integer}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                  />
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

// function FieldEntityTypeDisplay({ entityTypes }: { entityTypes: string[] }) {
//   return (
//     <TagInput>
//       {entityTypes.map((entityType) => (
//         <Tag key={entityType}>{entityType}</Tag>
//       ))}
//     </TagInput>
//   );
// }

// function FieldValueTypeDisplay({ valueTypes }: { valueTypes: string[] }) {
//   return (
//     <TagInput>
//       {valueTypes.map((valueType) => (
//         <Tag key={valueType}>{valueType}</Tag>
//       ))}
//     </TagInput>
//   );
// }

// function RichTextNodeDisplay({ richTextNodes }: { richTextNodes: string[] }) {
//   return (
//     <TagInput>
//       {richTextNodes.map((richTextNode) => (
//         <Tag key={richTextNode}>{richTextNode}</Tag>
//       ))}
//     </TagInput>
//   );
// }

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
          new SchemaEditorActions.ChangeFieldType(fieldSelector, item.type, item.list),
        );
      }
    },
    [dispatchSchemaEditorState, fieldSelector],
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
