import { Input, TextArea } from '@jonasb/datadata-design';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<string>;

export function StringFieldDisplay({ fieldSpec, value }: Props) {
  return fieldSpec.multiline ? (
    <TextArea value={value ?? ''} readOnly />
  ) : (
    <Input value={value ?? ''} readOnly />
  );
}
