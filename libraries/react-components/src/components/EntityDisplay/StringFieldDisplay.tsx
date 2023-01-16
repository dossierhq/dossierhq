import type { StringFieldSpecification } from '@dossierhq/core';
import { Input, TextArea } from '@jonasb/datadata-design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<StringFieldSpecification, string>;

export function StringFieldDisplay({ fieldSpec, value }: Props) {
  return fieldSpec.multiline ? (
    <TextArea value={value ?? ''} readOnly />
  ) : (
    <Input value={value ?? ''} readOnly />
  );
}
