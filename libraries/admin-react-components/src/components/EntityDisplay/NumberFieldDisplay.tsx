import type { NumberFieldSpecification } from '@jonasb/datadata-core';
import { Input } from '@jonasb/datadata-design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<NumberFieldSpecification, number>;

export function NumberFieldDisplay({ value }: Props) {
  return <Input value={value ?? ''} readOnly />;
}
