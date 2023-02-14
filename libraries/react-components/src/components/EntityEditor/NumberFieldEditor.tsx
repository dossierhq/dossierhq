import type { NumberFieldSpecification } from '@dossierhq/core';
import { Input, Text } from '@dossierhq/design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<NumberFieldSpecification, number>;

export function NumberFieldEditor({ fieldSpec, value, validationIssues, onChange }: Props) {
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
      <Input
        value={value ?? ''}
        type="number"
        step={isInteger ? 1 : 'any'}
        onChange={handleChange}
      />
      {validationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}
