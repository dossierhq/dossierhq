import type { ValueItem } from '@jonasb/datadata-core';
import React, { useCallback, useContext } from 'react';
import type { EntityFieldEditorProps } from '../../index.js';
import {
  DataDataContext,
  EntityFieldEditor,
  IconButton,
  Row,
  RowItem,
  Segment,
  TypePicker,
} from '../../index.js';

type Props = EntityFieldEditorProps<ValueItem>;

export function ValueTypeFieldEditor({
  id,
  value,
  draftState,
  valuePath,
  fieldSpec,
  onChange,
}: Props): JSX.Element {
  const { schema } = useContext(DataDataContext);
  const handleRemove = useCallback(() => onChange?.(null), [onChange]);

  if (!value) {
    return (
      <Segment>
        <TypePicker
          text="Add value item"
          showValueTypes
          valueTypes={fieldSpec.valueTypes}
          onTypeSelected={(type) => onChange?.({ type })}
        />
      </Segment>
    );
  }

  const { type } = value;
  const valueSpec = schema.getValueTypeSpecification(type);
  if (!valueSpec) {
    return <div>Error</div>;
  }

  return (
    <Segment>
      <Row gap={2}>
        <RowItem grow className="dd-text-caption">
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

        const fieldValuePath = [...valuePath, valueFieldSpec.name];

        return (
          <EntityFieldEditor
            idPrefix={id}
            key={valueFieldSpec.name}
            fieldSpec={valueFieldSpec}
            draftState={draftState}
            valuePath={fieldValuePath}
            value={value[valueFieldSpec.name]}
            onValueChanged={handleFieldChanged}
          />
        );
      })}
    </Segment>
  );
}
