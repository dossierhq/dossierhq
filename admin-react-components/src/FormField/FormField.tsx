import React from 'react';

interface Props {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: Props): JSX.Element {
  return (
    <div>
      <label>
        {label}
        {children}
      </label>
    </div>
  );
}
