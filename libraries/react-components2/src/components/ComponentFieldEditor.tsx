import {
  FieldType,
  groupValidationIssuesByTopLevelPath,
  type Component,
  type ComponentFieldSpecification,
  type FieldSpecification,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from '@dossierhq/core';
import { XIcon } from 'lucide-react';
import { Fragment, useCallback, useMemo, type ReactNode } from 'react';
import { useSchema } from '../hooks/useSchema.js';
import { FieldEditor, type FieldEditorProps } from './FieldEditor.js';
import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

type Props = FieldEditorProps<ComponentFieldSpecification, Component>;

export function ComponentFieldEditor({
  id,
  fieldSpec,
  adminOnly,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  const handleClear = useCallback(() => onChange(null), [onChange]);
  const handleCreate = useCallback((type: string) => onChange({ type }), [onChange]);

  if (!value) {
    return (
      <>
        <AddComponentButton id={id} fieldSpec={fieldSpec} onComponentTypeSelected={handleCreate} />
        <ValidationIssuesDisplay validationIssues={validationIssues} />
      </>
    );
  }

  return (
    <div className="group relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Remove"
        className="absolute top-1 right-1 size-6 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
        onClick={handleClear}
      >
        <XIcon />
      </Button>
      <ComponentFieldEditorWithoutClear
        id={id}
        value={value}
        adminOnly={adminOnly}
        validationIssues={validationIssues}
        dragHandle={dragHandle}
        onChange={onChange}
      />
    </div>
  );
}

const noErrors: (SaveValidationIssue | PublishValidationIssue)[] = [];

export function ComponentFieldEditorWithoutClear({
  id,
  className,
  value,
  adminOnly,
  validationIssues,
  dragHandle,
  onChange,
}: {
  id?: string;
  className?: string;
  value: Component;
  adminOnly: boolean;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  dragHandle?: ReactNode;
  onChange: (value: Component) => void;
}) {
  const { root: rootValidationIssues, children: fieldValidationIssues } = useMemo(
    () => groupValidationIssuesByTopLevelPath(validationIssues),
    [validationIssues],
  );

  const { schema } = useSchema();
  if (!schema) {
    return null;
  }

  const { type } = value;
  const componentSpec = schema.getComponentTypeSpecification(type);
  if (!componentSpec) {
    return <div>Error: no such component type “{type}”</div>;
  }

  return (
    <div id={id} className={className}>
      <p className="text-muted-foreground text-sm">
        {dragHandle}
        {type}
      </p>
      <div className="flex flex-col gap-1 border-l-2 pl-3">
        {componentSpec.fields.map((componentFieldSpec) => {
          const fieldEditor = (
            <ComponentField
              {...{
                value,
                componentFieldSpec,
                adminOnly: adminOnly || componentFieldSpec.adminOnly,
                onChange,
                validationIssues: fieldValidationIssues.get(componentFieldSpec.name) ?? noErrors,
              }}
            />
          );
          return (
            <Fragment key={componentFieldSpec.name}>
              <p className="text-sm font-medium">{componentFieldSpec.name}</p>
              {componentFieldSpec.type === FieldType.Component ? (
                <div className="pl-3">{fieldEditor}</div>
              ) : (
                fieldEditor
              )}
            </Fragment>
          );
        })}
      </div>
      <ValidationIssuesDisplay validationIssues={rootValidationIssues} />
    </div>
  );
}

export function AddComponentListItemButton({
  fieldSpec,
  onAddItem,
}: {
  fieldSpec: ComponentFieldSpecification;
  onAddItem: (value: Component | null) => void;
}) {
  const handleComponentTypeSelected = useCallback(
    (type: string) => onAddItem({ type }),
    [onAddItem],
  );
  return (
    <AddComponentButton
      fieldSpec={fieldSpec}
      onComponentTypeSelected={handleComponentTypeSelected}
    />
  );
}

function AddComponentButton({
  id,
  fieldSpec,
  onComponentTypeSelected,
}: {
  id?: string;
  fieldSpec: ComponentFieldSpecification;
  onComponentTypeSelected: (type: string) => void;
}) {
  const { schema } = useSchema();
  const componentTypes =
    fieldSpec.componentTypes.length > 0
      ? fieldSpec.componentTypes
      : (schema?.spec.componentTypes.map((it) => it.name) ?? []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id={id} className="self-start">
          Add component
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {componentTypes.map((type) => (
          <DropdownMenuItem key={type} onSelect={() => onComponentTypeSelected(type)}>
            {type}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ComponentField({
  value,
  componentFieldSpec,
  adminOnly,
  validationIssues,
  onChange,
}: {
  value: Component;
  componentFieldSpec: FieldSpecification;
  adminOnly: boolean;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  onChange: (value: Component) => void;
}) {
  const handleFieldChanged = useCallback(
    (newFieldValue: unknown) => {
      const newValue = { ...value };
      newValue[componentFieldSpec.name] = newFieldValue;
      onChange(newValue);
    },
    [onChange, value, componentFieldSpec.name],
  );

  return (
    <FieldEditor
      fieldSpec={componentFieldSpec}
      adminOnly={adminOnly}
      value={value[componentFieldSpec.name]}
      validationIssues={validationIssues}
      onChange={handleFieldChanged}
    />
  );
}
