import type { RichText } from '@jonasb/datadata-core';
import React from 'react';
import { RichTextEditor } from '../RichTextEditor/RichTextEditor';
import type { FieldEditorProps } from './FieldEditor';

type Props = FieldEditorProps<RichText>;

export function RichTextFieldEditor({ fieldSpec, value, onChange }: Props) {
  return <RichTextEditor fieldSpec={fieldSpec} value={value} onChange={onChange} />;
}
