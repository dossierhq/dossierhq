import type { BooleanFieldSpecification } from '@dossierhq/core';
import { XIcon } from 'lucide-react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

type Props = FieldEditorProps<BooleanFieldSpecification, boolean>;

export function BooleanFieldEditor({ id, value, validationIssues, dragHandle, onChange }: Props) {
  const handleCheckedChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      onChange(checked === true);
    },
    [onChange],
  );
  const handleClear = useCallback(() => onChange(null), [onChange]);

  return (
    <>
      <div className="group flex items-center gap-2">
        {dragHandle}
        <Checkbox id={id} checked={!!value} onCheckedChange={handleCheckedChange} />
        <label htmlFor={id} className="text-sm">
          {value === true ? 'True' : value === false ? 'False' : <i>Not set</i>}
        </label>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear"
          className="size-6 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          onClick={handleClear}
        >
          <XIcon />
        </Button>
      </div>
      <ValidationIssuesDisplay validationIssues={validationIssues} />
    </>
  );
}

export function AddBooleanListItemButton({
  onAddItem,
}: {
  fieldSpec: BooleanFieldSpecification;
  onAddItem: (value: boolean | null) => void;
}) {
  return (
    <Button className="self-start" onClick={() => onAddItem(null)}>
      Add
    </Button>
  );
}
