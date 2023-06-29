import type { NumberFieldSpecification } from '@dossierhq/core';
import { Button, Input, Row, Text, toFlexItemClassName } from '@dossierhq/design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<NumberFieldSpecification, number>;

export function NumberFieldEditor({
  fieldSpec,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  const isInteger = fieldSpec.integer;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const stringValue = event.target.value.trim();
      if (!stringValue) {
        onChange(null);
      } else {
        onChange(isInteger ? parseInt(stringValue) : parseFloat(stringValue));
      }
    },
    [onChange, isInteger]
  );

  return (
    <>
      <Row>
        {dragHandle}
        <Input
          value={value ?? ''}
          type="number"
          step={isInteger ? 1 : 'any'}
          onChange={handleChange}
        />
      </Row>
      {validationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}

export function AddNumberListItemButton({
  onAddItem,
}: {
  onAddItem: (value: number | null) => void;
}) {
  return (
    <Button
      className={toFlexItemClassName({ alignSelf: 'flex-start' })}
      onClick={() => onAddItem(null)}
    >
      Add
    </Button>
  );
}
