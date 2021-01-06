import React from 'react';

interface Props {
  value: string;
}

export function InputSubmit({ value }: Props): JSX.Element {
  return <input type="submit" value={value} />;
}
