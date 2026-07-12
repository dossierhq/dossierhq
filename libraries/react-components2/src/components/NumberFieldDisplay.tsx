import type { NumberFieldSpecification } from '@dossierhq/core';
import type { FieldDisplayProps } from './FieldDisplay.js';
import { Input } from './ui/input.js';

type Props = FieldDisplayProps<NumberFieldSpecification, number>;

export function NumberFieldDisplay({ id, value }: Props) {
  return <Input id={id} value={value ?? ''} readOnly />;
}
