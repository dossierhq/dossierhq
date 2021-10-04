import React from 'react';
import { joinClassNames } from '../../utils/ClassNameUtils.js';

export interface InputTextProps {
  id?: string;
  className?: string;
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
  className,
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
      className={joinClassNames('dd-text-body1 dd-input', className)}
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
