import React from 'react';

interface Props {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}

export function FormField({ htmlFor, label, children }: Props): JSX.Element {
  return (
    <div>
      <label htmlFor={htmlFor} className="dd text-subtitle1">
        {label}
      </label>
      <div className="dd form-control">{children}</div>
    </div>
  );
}
