import React from 'react';

interface Props {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: Props): JSX.Element {
  return (
    <div>
      <label className="dd text-subtitle1">
        {label}
        <div className="dd form-control">{children}</div>
      </label>
    </div>
  );
}
