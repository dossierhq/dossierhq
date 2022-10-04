import { Input, TextArea } from '@jonasb/datadata-design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<string>;

export function StringFieldEditor({ fieldSpec, value, onChange }: Props) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return fieldSpec.multiline ? (
    <TextArea value={value ?? ''} onChange={handleChange} />
  ) : (
    <Input value={value ?? ''} onChange={handleChange} />
  );
}
