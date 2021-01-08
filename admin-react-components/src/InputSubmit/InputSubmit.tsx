import React from 'react';

export interface InputSubmitProps {
  value: string;
  disabled?: boolean;
}

export function InputSubmit({ value, disabled }: InputSubmitProps): JSX.Element {
  return (
    <input
      className="dd button text-button bg-primary"
      type="submit"
      value={value}
      disabled={disabled}
    />
  );
}
