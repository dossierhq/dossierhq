import type {
  FieldSpecification,
  Component,
  ComponentFieldSpecification,
  PublishValidationIssue,
  SaveValidationIssue,
} from '@dossierhq/core';
import { FieldType, groupValidationIssuesByTopLevelPath } from '@dossierhq/core';
import { Column, Delete, HoverRevealStack, Text, toFlexItemClassName } from '@dossierhq/design';
import { Fragment, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { AdminTypePicker } from '../AdminTypePicker/AdminTypePicker.js';
import { FieldEditor, type FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<ComponentFieldSpecification, Component>;

export function ComponentFieldEditor({
  fieldSpec,
  adminOnly,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  const handleCreate = useCallback((type: string) => onChange({ type }), [onChange]);

  if (!value) {
    return (
      <>
        <AddComponentButton fieldSpec={fieldSpec} onComponentTypeSelected={handleCreate} />
        {validationIssues.map((error, index) => (
          <Text key={index} textStyle="body2" marginTop={1} color="danger">
            {error.message}
          </Text>
        ))}
      </>
    );
  }

  return (
    <HoverRevealStack>
      <HoverRevealStack.Item top right>
        <Delete onClick={handleDeleteClick} />
      </HoverRevealStack.Item>
      <ComponentFieldEditorWithoutClear
        value={value}
        adminOnly={adminOnly}
        validationIssues={validationIssues}
        dragHandle={dragHandle}
        onChange={onChange}
      />
    </HoverRevealStack>
  );
}

const noErrors: (SaveValidationIssue | PublishValidationIssue)[] = [];

export function ComponentFieldEditorWithoutClear({
  className,
  value,
  adminOnly,
  validationIssues,
  dragHandle,
  onChange,
}: {
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

  const { schema } = useContext(AdminDossierContext);
  if (!schema) {
    return null;
  }

  const { type } = value;
  const componentSpec = schema.getComponentTypeSpecification(type);
  if (!componentSpec) {
    return <div>Error</div>;
  }

  return (
    <Column className={className} gap={1}>
      <Text textStyle="body2" marginBottom={0}>
        {dragHandle}
        {type}
      </Text>
      {componentSpec.fields.map((valueFieldSpec) => {
        const fieldEditor = (
          <ComponentField
            {...{
              value,
              valueFieldSpec,
              adminOnly: adminOnly || valueFieldSpec.adminOnly,
              onChange,
              validationIssues: fieldValidationIssues.get(valueFieldSpec.name) ?? noErrors,
            }}
          />
        );
        return (
          <Fragment key={valueFieldSpec.name}>
            <Text textStyle="subtitle1" marginBottom={0}>
              {valueFieldSpec.name}
            </Text>
            {valueFieldSpec.type === FieldType.Component ? (
              <div className="nested-value-item-indentation">{fieldEditor}</div>
            ) : (
              fieldEditor
            )}
          </Fragment>
        );
      })}
      {rootValidationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </Column>
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
  fieldSpec,
  onComponentTypeSelected,
}: {
  fieldSpec: ComponentFieldSpecification;
  onComponentTypeSelected: (type: string) => void;
}) {
  return (
    <AdminTypePicker
      className={toFlexItemClassName({ alignSelf: 'flex-start' })}
      showComponentTypes
      componentTypes={fieldSpec.componentTypes}
      onTypeSelected={onComponentTypeSelected}
    >
      Add component
    </AdminTypePicker>
  );
}

function ComponentField({
  value,
  valueFieldSpec,
  adminOnly,
  validationIssues,
  onChange,
}: {
  value: Component;
  valueFieldSpec: FieldSpecification;
  adminOnly: boolean;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  onChange: (value: Component) => void;
}) {
  const handleFieldChanged = useCallback(
    (newFieldValue: unknown) => {
      const newValue = { ...value };
      newValue[valueFieldSpec.name] = newFieldValue;
      onChange(newValue);
    },
    [onChange, value, valueFieldSpec.name],
  );

  return (
    <FieldEditor
      fieldSpec={valueFieldSpec}
      adminOnly={adminOnly}
      value={value[valueFieldSpec.name]}
      validationIssues={validationIssues}
      onChange={handleFieldChanged}
    />
  );
}
