import { FieldType, RichTextNodeType } from '@dossierhq/core';
import { EllipsisVerticalIcon, XIcon } from 'lucide-react';
import { useCallback, useId, useMemo, useState, type Dispatch, type JSX } from 'react';
import {
  REQUIRED_NODES_PLACEHOLDER,
  RichTextNodePlaceholders,
  SchemaEditorActions,
  sortRichTextNodesWithPlaceholders,
  type SchemaEditorState,
  type SchemaEditorStateAction,
  type SchemaFieldDraft,
  type SchemaFieldSelector,
  type SchemaTypeSelector,
} from '../reducers/SchemaEditorReducer.js';
import { MultiCombobox } from './MultiCombobox.js';
import { IndexSelector, PatternSelector } from './SchemaEditorSelectors.js';
import { TypeDraftStatusBadge } from './TypeDraftStatusBadge.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.js';

interface Props {
  fieldSelector: SchemaFieldSelector;
  fieldDraft: SchemaFieldDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  dragHandle: JSX.Element;
  onAddOrRenameField: (selector: SchemaFieldSelector | SchemaTypeSelector) => void;
}

const FIELD_TYPES: FieldType[] = [
  FieldType.Boolean,
  FieldType.Component,
  FieldType.Reference,
  FieldType.Location,
  FieldType.Number,
  FieldType.RichText,
  FieldType.String,
];

export function SchemaFieldEditor({
  fieldSelector,
  fieldDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
  dragHandle,
  onAddOrRenameField,
}: Props) {
  const baseId = useId();
  const canChangeType = fieldDraft.status === 'new';

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

  const showEntityTypes =
    fieldDraft.type === FieldType.Reference ||
    (fieldDraft.type === FieldType.RichText &&
      (!fieldDraft.richTextNodesWithPlaceholders ||
        fieldDraft.richTextNodesWithPlaceholders.length === 0 ||
        fieldDraft.richTextNodesWithPlaceholders?.includes(RichTextNodeType.entity)));
  const showLinkEntityTypes =
    fieldDraft.type === FieldType.RichText &&
    (!fieldDraft.richTextNodesWithPlaceholders ||
      fieldDraft.richTextNodesWithPlaceholders.length === 0 ||
      fieldDraft.richTextNodesWithPlaceholders?.includes(RichTextNodeType.entityLink));
  const showComponentTypes =
    fieldDraft.type === FieldType.Component ||
    (fieldDraft.type === FieldType.RichText &&
      (!fieldDraft.richTextNodesWithPlaceholders ||
        fieldDraft.richTextNodesWithPlaceholders.length === 0 ||
        fieldDraft.richTextNodesWithPlaceholders?.includes(RichTextNodeType.component)));

  return (
    <div className="bg-background flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center gap-2">
        {dragHandle}
        <p className="grow font-medium">{fieldDraft.name}</p>
        {fieldDraft.status !== '' ? <TypeDraftStatusBadge status={fieldDraft.status} /> : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Field actions">
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onAddOrRenameField(fieldSelector)}>
              Rename field
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                dispatchSchemaEditorState(new SchemaEditorActions.DeleteField(fieldSelector))
              }
            >
              Delete field
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <CheckboxRow
          id={`${baseId}-required`}
          label="Required"
          checked={fieldDraft.required}
          onCheckedChange={(checked) =>
            dispatchSchemaEditorState(
              new SchemaEditorActions.ChangeFieldRequired(fieldSelector, checked),
            )
          }
        />
        <CheckboxRow
          id={`${baseId}-adminOnly`}
          label="Admin only"
          checked={fieldDraft.adminOnly}
          onCheckedChange={(checked) =>
            dispatchSchemaEditorState(
              new SchemaEditorActions.ChangeFieldAdminOnly(fieldSelector, checked),
            )
          }
        />
      </div>
      <div className="flex items-end gap-4">
        <FieldRow label="Type" htmlFor={`${baseId}-type`} className="grow">
          <Select
            disabled={!canChangeType}
            value={fieldDraft.type}
            onValueChange={(value) =>
              dispatchSchemaEditorState(
                new SchemaEditorActions.ChangeFieldType(
                  fieldSelector,
                  value as FieldType,
                  fieldDraft.list,
                ),
              )
            }
          >
            <SelectTrigger id={`${baseId}-type`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <div className="pb-2">
          <CheckboxRow
            id={`${baseId}-list`}
            label="List"
            disabled={!canChangeType}
            checked={fieldDraft.list}
            onCheckedChange={(checked) =>
              dispatchSchemaEditorState(
                new SchemaEditorActions.ChangeFieldType(fieldSelector, fieldDraft.type, checked),
              )
            }
          />
        </div>
      </div>
      {fieldDraft.type === FieldType.String ? (
        <CheckboxRow
          id={`${baseId}-multiline`}
          label="Multiline"
          checked={!!fieldDraft.multiline}
          onCheckedChange={(checked) =>
            dispatchSchemaEditorState(
              new SchemaEditorActions.ChangeFieldMultiline(fieldSelector, checked),
            )
          }
        />
      ) : null}
      {fieldDraft.type === FieldType.String ? (
        <FieldRow label="Index">
          <IndexSelector
            value={fieldDraft.index ?? null}
            schemaEditorState={schemaEditorState}
            onChange={handleIndexChange}
          />
        </FieldRow>
      ) : null}
      {fieldDraft.type === FieldType.String &&
      (!fieldDraft.values || fieldDraft.values.length === 0) ? (
        <FieldRow label="Match pattern">
          <PatternSelector
            value={fieldDraft.matchPattern ?? null}
            schemaEditorState={schemaEditorState}
            onChange={handleMatchPatternChange}
          />
        </FieldRow>
      ) : null}
      {fieldDraft.type === FieldType.String && !fieldDraft.matchPattern ? (
        <FieldRow label="Values">
          <ValuesEditor value={fieldDraft.values ?? []} onChange={handleValuesChange} />
        </FieldRow>
      ) : null}
      {fieldDraft.type === FieldType.RichText ? (
        <FieldRow label="Rich text nodes">
          <RichTextNodeSelector
            fieldSelector={fieldSelector}
            richTextNodes={fieldDraft.richTextNodesWithPlaceholders ?? []}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        </FieldRow>
      ) : null}
      {showEntityTypes ? (
        <FieldRow label="Entity types">
          <FieldEntityTypeSelector
            fieldSelector={fieldSelector}
            referenceOrLink="reference"
            entityTypes={fieldDraft.entityTypes ?? []}
            schemaEditorState={schemaEditorState}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        </FieldRow>
      ) : null}
      {showLinkEntityTypes ? (
        <FieldRow label="Link entity types">
          <FieldEntityTypeSelector
            fieldSelector={fieldSelector}
            referenceOrLink="link"
            entityTypes={fieldDraft.linkEntityTypes ?? []}
            schemaEditorState={schemaEditorState}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        </FieldRow>
      ) : null}
      {showComponentTypes ? (
        <FieldRow label="Component types">
          <FieldComponentTypeSelector
            fieldSelector={fieldSelector}
            componentTypes={fieldDraft.componentTypes ?? []}
            schemaEditorState={schemaEditorState}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        </FieldRow>
      ) : null}
      {fieldDraft.type === FieldType.Number ? (
        <FieldRow label="Number variant" htmlFor={`${baseId}-numberVariant`}>
          <Select
            value={fieldDraft.integer ? 'integer' : 'float'}
            onValueChange={(value) =>
              dispatchSchemaEditorState(
                new SchemaEditorActions.ChangeFieldInteger(fieldSelector, value === 'integer'),
              )
            }
          >
            <SelectTrigger id={`${baseId}-numberVariant`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="float">Float</SelectItem>
              <SelectItem value="integer">Integer</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      ) : null}
    </div>
  );
}

function FieldRow({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ? `flex flex-col gap-1 ${className}` : 'flex flex-col gap-1'}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CheckboxRow({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

function FieldEntityTypeSelector({
  fieldSelector,
  referenceOrLink,
  entityTypes,
  schemaEditorState,
  dispatchSchemaEditorState,
}: {
  fieldSelector: SchemaFieldSelector;
  referenceOrLink: 'reference' | 'link';
  entityTypes: string[];
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const items = schemaEditorState.entityTypes.map((it) => ({ value: it.name, label: it.name }));

  const handleChange = useCallback(
    (newValue: string[]) =>
      dispatchSchemaEditorState(
        referenceOrLink === 'reference'
          ? new SchemaEditorActions.ChangeFieldAllowedEntityTypes(fieldSelector, newValue)
          : new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(fieldSelector, newValue),
      ),
    [dispatchSchemaEditorState, fieldSelector, referenceOrLink],
  );

  return (
    <MultiCombobox
      items={items}
      selected={entityTypes}
      placeholder="Select entity types…"
      onSelect={(value) => handleChange([...entityTypes, value])}
      onUnselect={(value) => handleChange(entityTypes.filter((it) => it !== value))}
    />
  );
}

function FieldComponentTypeSelector({
  fieldSelector,
  componentTypes,
  schemaEditorState,
  dispatchSchemaEditorState,
}: {
  fieldSelector: SchemaFieldSelector;
  componentTypes: string[];
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const items = schemaEditorState.componentTypes.map((it) => ({ value: it.name, label: it.name }));

  const handleChange = useCallback(
    (newValue: string[]) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.ChangeFieldAllowedComponentTypes(fieldSelector, newValue),
      ),
    [dispatchSchemaEditorState, fieldSelector],
  );

  return (
    <MultiCombobox
      items={items}
      selected={componentTypes}
      placeholder="Select component types…"
      onSelect={(value) => handleChange([...componentTypes, value])}
      onUnselect={(value) => handleChange(componentTypes.filter((it) => it !== value))}
    />
  );
}

const RichTextNodesNotInPlaceholders: string[] = [
  RichTextNodeType.heading,
  RichTextNodeType.entity,
  RichTextNodeType.entityLink,
  RichTextNodeType.link,
  RichTextNodeType.component,
];

function RichTextNodeSelector({
  fieldSelector,
  richTextNodes,
  dispatchSchemaEditorState,
}: {
  fieldSelector: SchemaFieldSelector;
  richTextNodes: string[];
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const items = useMemo(() => {
    const allNodes = [
      ...RichTextNodePlaceholders.map((it) => it.name),
      ...RichTextNodesNotInPlaceholders,
    ];
    sortRichTextNodesWithPlaceholders(allNodes);
    return allNodes.map((it) => ({ value: it, label: it }));
  }, []);

  const handleSelect = useCallback(
    (value: string) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(fieldSelector, [
          ...richTextNodes,
          value,
        ]),
      ),
    [dispatchSchemaEditorState, fieldSelector, richTextNodes],
  );

  const handleUnselect = useCallback(
    (value: string) => {
      // The required nodes can only be removed when they are the only selected nodes
      if (value === REQUIRED_NODES_PLACEHOLDER.name && richTextNodes.length > 1) {
        return;
      }
      dispatchSchemaEditorState(
        new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(
          fieldSelector,
          richTextNodes.filter((it) => it !== value),
        ),
      );
    },
    [dispatchSchemaEditorState, fieldSelector, richTextNodes],
  );

  return (
    <MultiCombobox
      items={items}
      selected={richTextNodes}
      placeholder="Select rich text nodes…"
      onSelect={handleSelect}
      onUnselect={handleUnselect}
    />
  );
}

function ValuesEditor({
  value,
  onChange,
}: {
  value: { value: string }[];
  onChange: (value: { value: string }[]) => void;
}) {
  const [newValue, setNewValue] = useState('');

  const handleAddValue = () => {
    if (!newValue) {
      return;
    }
    onChange([...value, { value: newValue }]);
    setNewValue('');
  };

  const handleRemoveIndex = (index: number) => {
    const newValues = [...value];
    newValues.splice(index, 1);
    onChange(newValues);
  };

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.map((it, index) => (
            <Badge key={index} variant="secondary">
              {it.value}
              <button
                type="button"
                aria-label={`Remove ${it.value}`}
                className="ml-1 rounded-full"
                onClick={() => handleRemoveIndex(index)}
              >
                <XIcon className="text-muted-foreground hover:text-foreground h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={newValue}
          placeholder="Enter a value…"
          onChange={(event) => setNewValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAddValue();
            }
          }}
        />
        <Button type="button" variant="secondary" disabled={!newValue} onClick={handleAddValue}>
          Add
        </Button>
      </div>
    </div>
  );
}
