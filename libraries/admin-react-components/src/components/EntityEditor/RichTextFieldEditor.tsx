import type { RichText } from '@jonasb/datadata-core';
import { RichTextEditor } from '../RichTextEditor/RichTextEditor.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<RichText>;

export function RichTextFieldEditor({ fieldSpec, value, onChange }: Props) {
  return <RichTextEditor fieldSpec={fieldSpec} value={value} onChange={onChange} />;
}
