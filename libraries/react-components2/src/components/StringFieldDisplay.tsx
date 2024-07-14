import type { StringFieldSpecification } from '@dossierhq/core';
import type { FieldDisplayProps } from './FieldDisplay.js';
import { Input } from './ui/input.js';
import { Textarea } from './ui/textarea.js';

type Props = FieldDisplayProps<StringFieldSpecification, string>;

export function StringFieldDisplay({ fieldSpec, value }: Props) {
  return fieldSpec.multiline ? (
    <Textarea value={value ?? ''} readOnly />
  ) : (
    <Input value={value ?? ''} readOnly />
  );
}
