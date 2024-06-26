import type { PublishedStringFieldSpecification } from '@dossierhq/core';
import { Input, TextArea } from '@dossierhq/design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<PublishedStringFieldSpecification, string>;

export function StringFieldDisplay({ fieldSpec, value }: Props) {
  return fieldSpec.multiline ? (
    <TextArea value={value ?? ''} readOnly />
  ) : (
    <Input value={value ?? ''} readOnly />
  );
}
