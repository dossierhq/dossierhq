import type { NumberFieldSpecification } from '@dossierhq/core';
import { Input } from '@dossierhq/design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<NumberFieldSpecification, number>;

export function NumberFieldDisplay({ value }: Props) {
  return <Input value={value ?? ''} readOnly />;
}
