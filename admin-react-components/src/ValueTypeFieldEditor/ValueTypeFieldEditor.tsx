import type { Value } from '@datadata/core';
import React, { useCallback } from 'react';
import { EntityFieldEditor, EntityFieldEditorProps, IconButton, Segment } from '..';

type Props = EntityFieldEditorProps<Value>;

export function ValueTypeFieldEditor({
  id,
  value,
  schema,
  fieldSpec,
  onChange,
}: Props): JSX.Element {
  const handleRemove = useCallback(() => onChange?.(null), [onChange]);

  if (!value) {
    let valueTypes = schema.spec.valueTypes.map((x) => x.name);
    if (fieldSpec.valueTypes && fieldSpec.valueTypes.length > 0) {
      valueTypes = valueTypes.filter(
        (x) => fieldSpec.valueTypes && fieldSpec.valueTypes.indexOf(x) >= 0
      );
    }
    return (
      <Segment>
        <select
          id={id}
          onChange={(e) => {
            const newValueType = e.target.value;
            if (newValueType && onChange) {
              onChange({ _type: e.target.value });
            }
          }}
        >
          <option value="">Select value type</option>
          {valueTypes.map((valueType) => (
            <option key={valueType}>{valueType}</option>
          ))}
        </select>
      </Segment>
    );
  }

  const type = value._type;
  const valueSpec = schema.getValueTypeSpecification(type);
  if (!valueSpec) {
    return <div>Error</div>;
  }

  return (
    <Segment>
      <p className="dd text-caption">
        {type + ' '}
        <IconButton
          icon="remove"
          title="Remove value item"
          dataTestId={`${id}.remove`}
          onClick={handleRemove}
        />
      </p>
      {valueSpec.fields.map((valueFieldSpec) => {
        const handleFieldChanged = (newFieldValue: unknown) => {
          const newValue = { ...value };
          newValue[valueFieldSpec.name] = newFieldValue;
          onChange?.(newValue);
        };

        return (
          <EntityFieldEditor
            idPrefix={id}
            key={valueFieldSpec.name}
            schema={schema}
            fieldSpec={valueFieldSpec}
            value={value[valueFieldSpec.name]}
            onValueChanged={handleFieldChanged}
          />
        );
      })}
    </Segment>
  );
}
