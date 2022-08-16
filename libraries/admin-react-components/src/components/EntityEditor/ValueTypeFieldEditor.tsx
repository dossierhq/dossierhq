import type { FieldSpecification, ValueItem } from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';
import { Column, Delete, HoverRevealStack, Text } from '@jonasb/datadata-design';
import { Fragment, useCallback, useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { AdminTypePicker } from '../AdminTypePicker/AdminTypePicker';
import type { FieldEditorProps } from './FieldEditor';
import { FieldEditor } from './FieldEditor';

type Props = FieldEditorProps<ValueItem>;

export function ValueTypeFieldEditor({ fieldSpec, value, onChange }: Props) {
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
      <ValueItemFieldEditorWithoutClear value={value} onChange={onChange} />
    </HoverRevealStack>
  );
}

export function ValueItemFieldEditorWithoutClear({
  className,
  value,
  onChange,
}: {
  className?: string;
  value: ValueItem;
  onChange: (value: ValueItem) => void;
}) {
  const { schema } = useContext(AdminDataDataContext);
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
      <Text textStyle="body2" noBottomMargin>
        {type}
      </Text>
      {valueSpec.fields.map((valueFieldSpec) => {
        const fieldEditor = <ValueItemField {...{ value, valueFieldSpec, onChange }} />;
        return (
          <Fragment key={valueFieldSpec.name}>
            <Text textStyle="subtitle1" noBottomMargin>
              {valueFieldSpec.name}
            </Text>
            {valueFieldSpec.type === FieldType.ValueType ? (
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
  onChange,
}: {
  value: ValueItem;
  valueFieldSpec: FieldSpecification;
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
      onChange={handleFieldChanged}
    />
  );
}
