import { Checkbox } from '@jonasb/datadata-design';
import React from 'react';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<boolean>;

export function BooleanFieldDisplay({ value }: Props) {
  return (
    <Checkbox checked={!!value}>
      {value === true ? 'True' : value === false ? 'False' : <i>Not set</i>}
    </Checkbox>
  );
}
