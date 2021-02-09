import type { Value } from '@datadata/core';
import React, { useCallback } from 'react';
import { EntityFieldEditor, EntityFieldEditorProps, IconButton, Segment } from '../..';
import { TypePicker } from '../TypePicker/TypePicker';

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
    return (
      <Segment>
        <TypePicker
          id={id}
          text="Add value item"
          showValueTypes
          valueTypes={fieldSpec.valueTypes}
          schema={schema}
          onTypeSelected={(type) => onChange?.({ _type: type })}
        />
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
