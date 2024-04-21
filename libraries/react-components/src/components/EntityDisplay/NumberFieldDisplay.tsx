import type { PublishedNumberFieldSpecification } from '@dossierhq/core';
import { Input } from '@dossierhq/design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<PublishedNumberFieldSpecification, number>;

export function NumberFieldDisplay({ value }: Props) {
  return <Input value={value ?? ''} readOnly />;
}
