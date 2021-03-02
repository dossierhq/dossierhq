import React from 'react';

interface Props {
  onSubmit: () => void;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Form({ onSubmit, style, children }: Props): JSX.Element {
  return (
    <form
      className="dd segment has-shadow has-background"
      style={style}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
