import React from 'react';

export interface InputTextProps {
  id?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: 'text' | 'number';
  value: string | null;
  min?: number;
  max?: number;
  step?: number;
}

export function InputText({
  id,
  onChange,
  readOnly,
  type,
  value,
  min,
  max,
  step,
}: InputTextProps): JSX.Element {
  return (
    <input
      id={id}
      className="dd text-body1 input"
      type={type ?? 'text'}
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      readOnly={readOnly}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
    />
  );
}
