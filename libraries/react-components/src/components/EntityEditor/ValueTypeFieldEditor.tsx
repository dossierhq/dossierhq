import type {
  AdminFieldSpecification,
  PublishValidationError,
  SaveValidationError,
  ValueItem,
  ValueItemFieldSpecification,
} from '@dossierhq/core';
import { FieldType } from '@dossierhq/core';
import { Column, Delete, HoverRevealStack, Text } from '@dossierhq/design';
import { Fragment, useCallback, useContext, useMemo } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { groupValidationErrorsByTopLevelPath } from '../../utils/ValidationUtils.js';
import { AdminTypePicker } from '../AdminTypePicker/AdminTypePicker.js';
import type { FieldEditorProps } from './FieldEditor.js';
import { FieldEditor } from './FieldEditor.js';

type Props = FieldEditorProps<ValueItemFieldSpecification, ValueItem>;

export function ValueTypeFieldEditor({ fieldSpec, value, validationErrors, onChange }: Props) {
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  const handleCreate = useCallback((type: string) => onChange({ type }), [onChange]);

  if (!value) {
    return (
      <AdminTypePicker
        showValueTypes
        valueTypes={fieldSpec.valueTypes}
        onTypeSelected={handleCreate}
      >
        Add value item
      </AdminTypePicker>
    );
  }

  return (
    <HoverRevealStack>
      <HoverRevealStack.Item top right>
        <Delete onClick={handleDeleteClick} />
      </HoverRevealStack.Item>
      <ValueItemFieldEditorWithoutClear
        value={value}
        validationErrors={validationErrors}
        onChange={onChange}
      />
    </HoverRevealStack>
  );
}

const noErrors: (SaveValidationError | PublishValidationError)[] = [];

export function ValueItemFieldEditorWithoutClear({
  className,
  value,
  validationErrors,
  onChange,
}: {
  className?: string;
  value: ValueItem;
  validationErrors: (SaveValidationError | PublishValidationError)[];
  onChange: (value: ValueItem) => void;
}) {
  const fieldValidationErrors = useMemo(
    () => groupValidationErrorsByTopLevelPath(validationErrors),
    [validationErrors]
  );

  const { schema } = useContext(AdminDossierContext);
  if (!schema) {
    return null;
  }

  const { type } = value;
  const valueSpec = schema.getValueTypeSpecification(type);
  if (!valueSpec) {
    return <div>Error</div>;
  }

  return (
    <Column className={className} gap={1}>
      <Text textStyle="body2" marginBottom={0}>
        {type}
      </Text>
      {valueSpec.fields.map((valueFieldSpec) => {
        const fieldEditor = (
          <ValueItemField
            {...{
              value,
              valueFieldSpec,
              onChange,
              validationErrors: fieldValidationErrors.get(valueFieldSpec.name) ?? noErrors,
            }}
          />
        );
        return (
          <Fragment key={valueFieldSpec.name}>
            <Text textStyle="subtitle1" marginBottom={0}>
              {valueFieldSpec.name}
            </Text>
            {valueFieldSpec.type === FieldType.ValueItem ? (
              <div className="nested-value-item-indentation">{fieldEditor}</div>
            ) : (
              fieldEditor
            )}
          </Fragment>
        );
      })}
    </Column>
  );
}

function ValueItemField({
  value,
  valueFieldSpec,
  validationErrors,
  onChange,
}: {
  value: ValueItem;
  valueFieldSpec: AdminFieldSpecification;
  validationErrors: (SaveValidationError | PublishValidationError)[];
  onChange: (value: ValueItem) => void;
}) {
  const handleFieldChanged = useCallback(
    (newFieldValue: unknown) => {
      const newValue = { ...value };
      newValue[valueFieldSpec.name] = newFieldValue;
      onChange(newValue);
    },
    [onChange, value, valueFieldSpec.name]
  );

  return (
    <FieldEditor
      fieldSpec={valueFieldSpec}
      value={value[valueFieldSpec.name]}
      validationErrors={validationErrors}
      onChange={handleFieldChanged}
    />
  );
}
