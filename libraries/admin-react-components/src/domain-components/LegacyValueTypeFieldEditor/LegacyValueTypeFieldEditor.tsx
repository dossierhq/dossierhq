import type { ValueItem } from '@jonasb/datadata-core';
import React, { useCallback, useContext } from 'react';
import type { LegacyEntityFieldEditorProps } from '../..';
import {
  LegacyDataDataContext,
  LegacyEntityFieldEditor,
  IconButton,
  Row,
  RowItem,
  Segment,
  LegacyTypePicker,
} from '../..';

type Props = LegacyEntityFieldEditorProps<ValueItem>;

export function LegacyValueTypeFieldEditor({
  id,
  value,
  draftState,
  valuePath,
  fieldSpec,
  onChange,
}: Props): JSX.Element {
  const { schema } = useContext(LegacyDataDataContext);
  const handleRemove = useCallback(() => onChange?.(null), [onChange]);

  if (!value) {
    return (
      <Segment>
        <LegacyTypePicker
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
          <LegacyEntityFieldEditor
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
