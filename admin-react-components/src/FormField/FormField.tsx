import React, { useState } from 'react';

interface Props {
  label: string;
  render: ({ id }: { id: string }) => React.ReactNode;
}

export function FormField({ label, render }: Props): JSX.Element {
  const [id] = useState(String(Math.random()));
  return (
    <div>
      <label htmlFor={id} className="dd text-subtitle1">
        {label}
      </label>
      <div className="dd form-control">{render({ id })}</div>
    </div>
  );
}
