import type { ValueItem } from '@datadata/core';
import React, { useCallback, useContext } from 'react';
import type { EntityFieldEditorProps } from '../..';
import {
  DataDataContext,
  EntityFieldEditor,
  IconButton,
  Row,
  RowItem,
  Segment,
  TypePicker,
} from '../..';

type Props = EntityFieldEditorProps<ValueItem>;

export function ValueTypeFieldEditor({ id, value, fieldSpec, onChange }: Props): JSX.Element {
  const { schema } = useContext(DataDataContext);
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
        <RowItem grow className="text-caption">
          {type}
        </RowItem>
        <RowItem
          as={IconButton}
          icon="remove"
          title="Remove value item"
          dataTestId={`${id}.remove`}
          onClick={handleRemove}
        />
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
            fieldSpec={valueFieldSpec}
            value={value[valueFieldSpec.name]}
            onValueChanged={handleFieldChanged}
          />
        );
      })}
    </Segment>
  );
}
