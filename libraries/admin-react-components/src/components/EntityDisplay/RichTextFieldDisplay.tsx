import type { RichText } from '@jonasb/datadata-core';
import { RichTextDisplay } from '../RichTextDisplay/RichTextDisplay.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<RichText>;

export function RichTextFieldDisplay({ fieldSpec, value }: Props) {
  return <RichTextDisplay fieldSpec={fieldSpec} value={value} />;
}
