import type { PublishedBooleanFieldSpecification } from '@dossierhq/core';
import { Checkbox } from '@dossierhq/design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<PublishedBooleanFieldSpecification, boolean>;

export function BooleanFieldDisplay({ value }: Props) {
  return (
    <Checkbox checked={!!value}>
      {value === true ? 'True' : value === false ? 'False' : <i>Not set</i>}
    </Checkbox>
  );
}
