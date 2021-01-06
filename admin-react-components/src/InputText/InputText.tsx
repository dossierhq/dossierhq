import React from 'react';

interface Props {
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string | null;
}

export function InputText({ onChange, readOnly, value }: Props): JSX.Element {
  return (
    <input
      type="text"
      value={value ?? ''}
      readOnly={readOnly}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
    />
  );
}
