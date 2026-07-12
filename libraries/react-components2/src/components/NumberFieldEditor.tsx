import type { NumberFieldSpecification } from '@dossierhq/core';
import { useCallback, type ChangeEvent } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

type Props = FieldEditorProps<NumberFieldSpecification, number>;

export function NumberFieldEditor({
  id,
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
    [onChange, isInteger],
  );

  return (
    <>
      <div className="flex items-center gap-2">
        {dragHandle}
        <Input
          id={id}
          className="flex-grow"
          value={value ?? ''}
          type="number"
          step={isInteger ? 1 : 'any'}
          onChange={handleChange}
        />
      </div>
      <ValidationIssuesDisplay validationIssues={validationIssues} />
    </>
  );
}

export function AddNumberListItemButton({
  onAddItem,
}: {
  fieldSpec: NumberFieldSpecification;
  onAddItem: (value: number | null) => void;
}) {
  return (
    <Button className="self-start" onClick={() => onAddItem(null)}>
      Add
    </Button>
  );
}
