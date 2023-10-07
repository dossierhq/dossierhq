import type {
  AdminFieldSpecification,
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

export function ValueItemFieldEditor({
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
        <AddValueItemButton fieldSpec={fieldSpec} onValueTypeSelected={handleCreate} />
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
      <ValueItemFieldEditorWithoutClear
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

export function ValueItemFieldEditorWithoutClear({
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
  const valueSpec = schema.getComponentTypeSpecification(type);
  if (!valueSpec) {
    return <div>Error</div>;
  }

  return (
    <Column className={className} gap={1}>
      <Text textStyle="body2" marginBottom={0}>
        {dragHandle}
        {type}
      </Text>
      {valueSpec.fields.map((valueFieldSpec) => {
        const fieldEditor = (
          <ValueItemField
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

export function AddValueItemListItemButton({
  fieldSpec,
  onAddItem,
}: {
  fieldSpec: AdminFieldSpecification<ComponentFieldSpecification>;
  onAddItem: (value: Component | null) => void;
}) {
  const handleValueTypeSelected = useCallback((type: string) => onAddItem({ type }), [onAddItem]);
  return <AddValueItemButton fieldSpec={fieldSpec} onValueTypeSelected={handleValueTypeSelected} />;
}

function AddValueItemButton({
  fieldSpec,
  onValueTypeSelected,
}: {
  fieldSpec: AdminFieldSpecification<ComponentFieldSpecification>;
  onValueTypeSelected: (type: string) => void;
}) {
  return (
    <AdminTypePicker
      className={toFlexItemClassName({ alignSelf: 'flex-start' })}
      showValueTypes
      valueTypes={fieldSpec.componentTypes}
      onTypeSelected={onValueTypeSelected}
    >
      Add value item
    </AdminTypePicker>
  );
}

function ValueItemField({
  value,
  valueFieldSpec,
  adminOnly,
  validationIssues,
  onChange,
}: {
  value: Component;
  valueFieldSpec: AdminFieldSpecification;
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
