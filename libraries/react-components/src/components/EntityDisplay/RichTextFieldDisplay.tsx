import type { PublishedRichTextFieldSpecification, RichText } from '@dossierhq/core';
import { RichTextDisplay } from '../RichTextDisplay/RichTextDisplay.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<PublishedRichTextFieldSpecification, RichText>;

export function RichTextFieldDisplay({ fieldSpec, value }: Props) {
  return <RichTextDisplay fieldSpec={fieldSpec} value={value} />;
}
