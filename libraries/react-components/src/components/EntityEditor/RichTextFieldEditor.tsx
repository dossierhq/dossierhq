import type { RichText, RichTextFieldSpecification } from '@dossierhq/core';
import { Text } from '@dossierhq/design';
import { useMemo } from 'react';
import { RichTextEditor } from '../RichTextEditor/RichTextEditor.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<RichTextFieldSpecification, RichText>;

export function RichTextFieldEditor({
  fieldSpec,
  adminOnly,
  value,
  validationErrors,
  onChange,
}: Props) {
  //TODO validation errors in value items in the rich text are shown both here and in the value item editor
  //TODO would be good to show the validation errors in context in the rich text editor
  const uniqueValidationErrors = useMemo(() => {
    const messages = new Set<string>(validationErrors.map((error) => error.message));
    return [...messages];
  }, [validationErrors]);
  return (
    <>
      <RichTextEditor
        fieldSpec={fieldSpec}
        adminOnly={adminOnly}
        value={value}
        onChange={onChange}
      />
      {uniqueValidationErrors.map((message, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {message}
        </Text>
      ))}
    </>
  );
}
