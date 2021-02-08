import React from 'react';

interface Props {
  onSubmit: () => void;
  children: React.ReactNode;
}

export function Form({ onSubmit, children }: Props): JSX.Element {
  return (
    <form
      className="dd segment has-background"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
