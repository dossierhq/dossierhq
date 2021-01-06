import React from 'react';

interface Props {
  value: string;
  disabled?: boolean;
}

export function InputSubmit({ value, disabled }: Props): JSX.Element {
  return <input type="submit" value={value} disabled={disabled} />;
}
