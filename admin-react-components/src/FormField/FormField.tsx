import React from 'react';

interface Props {
  controlId: string;
  label: string;
  render: ({ id }: { id: string }) => React.ReactNode;
}

export function FormField({ controlId, label, render }: Props): JSX.Element {
  return (
    <div>
      <label htmlFor={controlId} className="dd text-subtitle1">
        {label}
      </label>
      <div className="dd form-control">{render({ id: controlId })}</div>
    </div>
  );
}
