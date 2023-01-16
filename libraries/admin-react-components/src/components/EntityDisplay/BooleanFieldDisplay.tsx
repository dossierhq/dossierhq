import type { BooleanFieldSpecification } from '@dossierhq/core';
import { Checkbox } from '@jonasb/datadata-design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<BooleanFieldSpecification, boolean>;

export function BooleanFieldDisplay({ value }: Props) {
  return (
    <Checkbox checked={!!value}>
      {value === true ? 'True' : value === false ? 'False' : <i>Not set</i>}
    </Checkbox>
  );
}
