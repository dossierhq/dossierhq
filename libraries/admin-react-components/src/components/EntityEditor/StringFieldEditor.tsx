import { Input } from '@jonasb/datadata-design';
import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor';

type Props = FieldEditorProps<string>;

export function StringFieldEditor({ value, onChange }: Props) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );
  return <Input value={value ?? ''} onChange={handleChange} />;
}
