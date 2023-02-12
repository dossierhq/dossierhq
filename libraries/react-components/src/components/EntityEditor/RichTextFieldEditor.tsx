import type { RichText, RichTextFieldSpecification } from '@dossierhq/core';
import { Text } from '@dossierhq/design';
import { RichTextEditor } from '../RichTextEditor/RichTextEditor.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<RichTextFieldSpecification, RichText>;

export function RichTextFieldEditor({ fieldSpec, value, validationErrors, onChange }: Props) {
  return (
    <>
      <RichTextEditor fieldSpec={fieldSpec} value={value} onChange={onChange} />{' '}
      {validationErrors.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}
