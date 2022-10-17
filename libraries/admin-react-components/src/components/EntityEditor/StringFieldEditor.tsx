import { Input, Text, TextArea } from '@jonasb/datadata-design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<string>;

export function StringFieldEditor({ fieldSpec, value, validationErrors, onChange }: Props) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <>
      {fieldSpec.multiline ? (
        <TextArea value={value ?? ''} onChange={handleChange} />
      ) : (
        <Input value={value ?? ''} onChange={handleChange} />
      )}
      {validationErrors.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}
