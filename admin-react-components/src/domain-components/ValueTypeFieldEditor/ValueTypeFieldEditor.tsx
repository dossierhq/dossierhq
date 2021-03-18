import type { Value } from '@datadata/core';
import React, { useCallback } from 'react';
import type { EntityFieldEditorProps } from '../..';
import { EntityFieldEditor, IconButton, Row, Segment, TypePicker } from '../..';

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
      <Row gap={2}>
        <Row.Column grow className="text-caption">
          {type}
        </Row.Column>
        <Row.Column>
          <IconButton
            icon="remove"
            title="Remove value item"
            dataTestId={`${id}.remove`}
            onClick={handleRemove}
          />
        </Row.Column>
      </Row>
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
