import React from 'react';

export interface InputTextProps {
  id?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: 'text' | 'number';
  value: string | null;
}

export function InputText({ id, onChange, readOnly, type, value }: InputTextProps): JSX.Element {
  return (
    <input
      id={id}
      className="dd text-body1 input"
      type={type ?? 'text'}
      value={value ?? ''}
      readOnly={readOnly}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
    />
  );
}
