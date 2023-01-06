import type { NumberFieldSpecification } from '@jonasb/datadata-core';
import { Input } from '@jonasb/datadata-design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<NumberFieldSpecification, number>;

export function NumberFieldEditor({ fieldSpec, value, onChange }: Props) {
  const isInteger = fieldSpec.integer;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(isInteger ? parseInt(event.target.value) : parseFloat(event.target.value));
    },
    [onChange, isInteger]
  );

  return (
    <Input value={value ?? ''} type="number" step={isInteger ? 1 : 'any'} onChange={handleChange} />
  );
}
