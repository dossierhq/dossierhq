import type { BooleanFieldSpecification } from '@dossierhq/core';
import type { FieldDisplayProps } from './FieldDisplay.js';
import { Checkbox } from './ui/checkbox.js';

type Props = FieldDisplayProps<BooleanFieldSpecification, boolean>;

export function BooleanFieldDisplay({ id, value }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={!!value} disabled />
      <label htmlFor={id} className="text-sm">
        {value === true ? 'True' : value === false ? 'False' : <i>Not set</i>}
      </label>
    </div>
  );
}
