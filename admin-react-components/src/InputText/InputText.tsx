import React from 'react';

interface Props {
  id?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string | null;
}

export function InputText({ id, onChange, readOnly, value }: Props): JSX.Element {
  return (
    <input
      id={id}
      className="dd text-body1 input"
      type="text"
      value={value ?? ''}
      readOnly={readOnly}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
    />
  );
}
